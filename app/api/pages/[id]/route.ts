// app/api/pages/[id]/route.ts - Handle specific page operations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageManager } from '@/lib/pageManager';
import { CONFIG, ValidationHelpers } from '@/lib/config';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('series') || undefined;

    // Try to parse as page number first
    const pageNumber = parseInt(params.id);
    if (!isNaN(pageNumber)) {
      const pageData = await PageManager.getPageData(pageNumber, seriesId);
      if (!pageData) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: pageData
      });
    }

    // Otherwise treat as page ID
    const pageData = await PageManager.getPageById(params.id);
    if (!pageData) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: pageData
    });

  } catch (error) {
    console.error('Get page error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { names, title, description } = body;

    // Validate names if provided
    if (names && !ValidationHelpers.isValidNamesPage(names)) {
      return NextResponse.json(
        { error: `Page must contain 1-${CONFIG.PAGE.NAMES_PER_PAGE} names` },
        { status: 400 }
      );
    }

    // Check if user owns this page or has admin/manager role
    const existingPage = await PageManager.getPageById(params.id);
    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const userRole = session.user.role;
    const isOwner = existingPage.createdBy === session.user.id;
    const canEdit = isOwner || (userRole && ['ADMIN', 'MANAGER'].includes(userRole));

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You can only edit pages you created' },
        { status: 403 }
      );
    }

    const updatedPage = await PageManager.updatePage(params.id, {
      names,
      title,
      description,
    });

    return NextResponse.json({
      success: true,
      data: updatedPage
    });

  } catch (error) {
    console.error('Update page error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this page or has admin/manager role
    const existingPage = await PageManager.getPageById(params.id);
    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const userRole = session.user.role;
    const isOwner = existingPage.createdBy === session.user.id;
    const canDelete = isOwner || (userRole && ['ADMIN', 'MANAGER'].includes(userRole));

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You can only delete pages you created' },
        { status: 403 }
      );
    }

    await PageManager.deletePage(params.id);

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('Delete page error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}