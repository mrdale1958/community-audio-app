// app/api/import/filemaker/route.ts - API endpoint for FileMaker import

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or manager role
    const userRole = session.user.role;
    if (!userRole || !['ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins and managers can import data.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      dryRun = false, 
      seriesId = 'filemaker-import',
      seriesTitle = 'FileMaker Import'
    } = body;

    // Dynamic import to avoid loading the importer unless needed
    const FileMakerImporter = (await import('@/scripts/import-from-filemaker')).default;
    
    const importer = new FileMakerImporter();
    
    const result = await importer.fullImport(session.user.id, {
      dryRun,
      seriesId,
      seriesTitle
    });

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed successfully' : 'Import completed successfully',
      data: result
    });

  } catch (error) {
    console.error('FileMaker import error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Import failed', 
          details: error.message,
          success: false 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return import status/info
    return NextResponse.json({
      success: true,
      info: {
        message: 'FileMaker import endpoint ready',
        supportedOperations: ['POST'],
        requiredRole: 'ADMIN or MANAGER',
        parameters: {
          dryRun: 'boolean - Preview import without making changes',
          seriesId: 'string - Identifier for this import series',
          seriesTitle: 'string - Display name for this import series'
        }
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}