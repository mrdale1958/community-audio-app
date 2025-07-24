// app/api/pages/route.ts - Enhanced pages API with configuration support

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageManager } from '@/lib/pageManager';
import { CONFIG, PageHelpers, ValidationHelpers } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageNumber = searchParams.get('page');
    const seriesId = searchParams.get('series') || undefined;
    const search = searchParams.get('search');
    const needsRecording = searchParams.get('needsRecording') === 'true';
    const stats = searchParams.get('stats') === 'true';

    // Return stats only
    if (stats) {
      const statistics = await PageManager.getRecordingStats(seriesId);
      return NextResponse.json({
        success: true,
        data: {
          ...statistics,
          config: {
            namesPerPage: CONFIG.PAGE.NAMES_PER_PAGE,
            maxPages: CONFIG.PAGE.MAX_PAGES,
            targetRecordings: CONFIG.EXHIBITION.TARGET_RECORDINGS,
          }
        }
      });
    }

    // Get specific page
    if (pageNumber) {
      const pageNum = parseInt(pageNumber);
      if (!PageHelpers.isValidPageNumber(pageNum)) {
        return NextResponse.json(
          { error: `Invalid page number. Must be between ${CONFIG.PAGE.DEFAULT_START_PAGE} and ${CONFIG.PAGE.MAX_PAGES}` },
          { status: 400 }
        );
      }

      const pageData = await PageManager.getPageData(pageNum, seriesId);
      if (!pageData) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: pageData
      });
    }

    // Search pages
    if (search) {
      const results = await PageManager.searchPages(search, seriesId);
      return NextResponse.json({
        success: true,
        data: results,
        meta: {
          query: search,
          count: results.length
        }
      });
    }

    // Get pages needing recordings
    if (needsRecording) {
      const pages = await PageManager.getPagesNeedingRecordings(seriesId);
      return NextResponse.json({
        success: true,
        data: pages
      });
    }

    // Get all pages summary
    const pagesSummary = await PageManager.getPagesSummary(seriesId);
    return NextResponse.json({
      success: true,
      data: pagesSummary,
      meta: {
        totalPages: pagesSummary.length,
        config: {
          namesPerPage: CONFIG.PAGE.NAMES_PER_PAGE,
          pagePrefix: CONFIG.PAGE.PAGE_NUMBER_PREFIX,
        }
      }
    });

  } catch (error) {
    console.error('Pages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { names, pageNumber, seriesId, title, description, createMultiple } = body;

    // Validate required fields
    if (!names || !Array.isArray(names)) {
      return NextResponse.json(
        { error: 'Names array is required' },
        { status: 400 }
      );
    }

    // Create multiple pages from large name list
    if (createMultiple) {
      if (names.length === 0) {
        return NextResponse.json(
          { error: 'At least one name is required' },
          { status: 400 }
        );
      }

      const totalPages = PageHelpers.calculateTotalPages(names.length);
      if (totalPages > CONFIG.PAGE.MAX_PAGES) {
        return NextResponse.json(
          { error: `Too many names. Maximum ${CONFIG.PAGE.MAX_PAGES} pages allowed (${CONFIG.PAGE.MAX_PAGES * CONFIG.PAGE.NAMES_PER_PAGE} names)` },
          { status: 400 }
        );
      }

      const pages = await PageManager.createPagesFromNames(names, session.user.id, {
        seriesId,
        seriesTitle: title,
      });

      return NextResponse.json({
        success: true,
        data: pages,
        meta: {
          totalPages: pages.length,
          totalNames: names.length,
          namesPerPage: CONFIG.PAGE.NAMES_PER_PAGE,
        }
      });
    }

    // Create single page
    if (pageNumber === undefined) {
      return NextResponse.json(
        { error: 'Page number is required for single page creation' },
        { status: 400 }
      );
    }

    if (!ValidationHelpers.isValidNamesPage(names)) {
      return NextResponse.json(
        { error: `Page must contain 1-${CONFIG.PAGE.NAMES_PER_PAGE} names` },
        { status: 400 }
      );
    }

    if (!PageHelpers.isValidPageNumber(pageNumber)) {
      return NextResponse.json(
        { error: `Invalid page number. Must be between ${CONFIG.PAGE.DEFAULT_START_PAGE} and ${CONFIG.PAGE.MAX_PAGES}` },
        { status: 400 }
      );
    }

    const page = await PageManager.createPage(names, pageNumber, session.user.id, {
      title,
      seriesId,
      description,
    });

    return NextResponse.json({
      success: true,
      data: page
    });

  } catch (error) {
    console.error('Create page error:', error);
    
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, names } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    if (!names || !Array.isArray(names)) {
      return NextResponse.json(
        { error: 'Names array is required' },
        { status: 400 }
      );
    }

    if (!ValidationHelpers.isValidNamesPage(names)) {
      return NextResponse.json(
        { error: `Page must contain 1-${CONFIG.PAGE.NAMES_PER_PAGE} names` },
        { status: 400 }
      );
    }

    const updatedPage = await PageManager.updatePageNames(pageId, names);

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or manager role
    const userRole = session.user.role;
    if (!userRole || !['ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins and managers can delete pages.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    await PageManager.deletePage(pageId);

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