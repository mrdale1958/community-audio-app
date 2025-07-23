import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (method && method !== 'ALL') {
      where.recordingMethod = method;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { nameList: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [recordings, total] = await Promise.all([
      prisma.recording.findMany({
        where,
        include: {
          nameList: {
            select: {
              id: true,
              title: true,
              pageNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recording.count({ where }),
    ]);

    return NextResponse.json({
      recordings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }
}