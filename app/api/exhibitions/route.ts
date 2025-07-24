import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/prisma';
import { CONFIG } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), CONFIG.MAX_PAGINATION_SIZE);
    const skip = (page - 1) * limit;
    const upcoming = url.searchParams.get('upcoming') === 'true';

    // Build where clause
    let whereClause: any = {};

    // GALLERIST can only see their own exhibitions
    if (session.user.role === UserRole.GALLERIST) {
      whereClause.galleristId = session.user.id;
    }

    // Filter for upcoming exhibitions if requested
    if (upcoming) {
      whereClause.startDate = {
        gte: new Date()
      };
    }

    // For non-authenticated users (observers), only show upcoming public exhibitions
    if (![UserRole.ADMIN, UserRole.GALLERIST, UserRole.MANAGER].includes(session.user.role as UserRole)) {
      whereClause = {
        ...whereClause,
        startDate: {
          gte: new Date()
        }
      };
    }

    const [exhibitions, total] = await Promise.all([
      prisma.exhibition.findMany({
        where: whereClause,
        include: {
          gallerist: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              queue: true,
              psaFiles: true,
              playbackLogs: true
            }
          }
        },
        orderBy: upcoming ? { startDate: 'asc' } : { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.exhibition.count({ where: whereClause })
    ]);

    // Parse JSON fields for response
    const exhibitionsWithParsedData = exhibitions.map(exhibition => ({
      ...exhibition,
      galleryHours: JSON.parse(exhibition.galleryHours),
      settings: exhibition.settings ? JSON.parse(exhibition.settings) : null
    }));

    return NextResponse.json({
      exhibitions: exhibitionsWithParsedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and GALLERIST can create exhibitions
    if (![UserRole.ADMIN, UserRole.GALLERIST].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      galleryHours = CONFIG.DEFAULT_GALLERY_HOURS,
      psaFrequency = CONFIG.DEFAULT_PSA_FREQUENCY,
      galleristId
    } = body;

    // Validation
    if (!title || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, startDate, endDate' 
      }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }

    if (psaFrequency < CONFIG.MIN_PSA_FREQUENCY || psaFrequency > CONFIG.MAX_PSA_FREQUENCY) {
      return NextResponse.json({ 
        error: `PSA frequency must be between ${CONFIG.MIN_PSA_FREQUENCY} and ${CONFIG.MAX_PSA_FREQUENCY}` 
      }, { status: 400 });
    }

    // GALLERIST can only create exhibitions for themselves
    const finalGalleristId = session.user.role === UserRole.GALLERIST 
      ? session.user.id 
      : galleristId || session.user.id;

    // Verify the gallerist exists and has the right role
    const gallerist = await prisma.user.findUnique({
      where: { id: finalGalleristId }
    });

    if (!gallerist || ![UserRole.GALLERIST, UserRole.ADMIN].includes(gallerist.role as UserRole)) {
      return NextResponse.json({ 
        error: 'Invalid gallerist ID or user is not a gallerist' 
      }, { status: 400 });
    }

    // Create default exhibition settings
    const defaultSettings = {
      allowManualControl: true,
      fadeTransitions: true,
      fadeDuration: CONFIG.FADE_DURATION,
      silenceBetweenRecordings: CONFIG.SILENCE_BETWEEN_RECORDINGS,
      maxPlaybackAttempts: CONFIG.MAX_PLAYBACK_ATTEMPTS,
      autoRestartOnError: true
    };

    const exhibition = await prisma.exhibition.create({
      data: {
        title,
        description,
        startDate: start,
        endDate: end,
        galleristId: finalGalleristId,
        galleryHours: JSON.stringify(galleryHours),
        psaFrequency,
        settings: JSON.stringify(defaultSettings)
      },
      include: {
        gallerist: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      exhibition: {
        ...exhibition,
        galleryHours: JSON.parse(exhibition.galleryHours),
        settings: JSON.parse(exhibition.settings || '{}')
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating exhibition:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}