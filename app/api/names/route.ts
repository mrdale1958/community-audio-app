// app/api/names/route.ts - Direct name pagination API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid page or limit parameters' },
        { status: 400 }
      );
    }

    // Get names for the page with efficient pagination
    const names = await prisma.name.findMany({
      skip: offset,
      take: limit,
      orderBy: { importOrder: 'asc' },
      select: {
        id: true,
        name: true,
        importOrder: true,
        artifactNumber: true,
        blockNumber: true,
        recordings: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    // Calculate total pages (cached count for performance)
    const totalNames = 91897; // Static count since this won't change
    const totalPages = Math.ceil(totalNames / limit);

    // Generate page display info
    const pageInfo = {
      page,
      limit,
      totalNames,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startName: offset + 1,
      endName: Math.min(offset + limit, totalNames),
      displayTitle: `Page ${page}`
    };

    return NextResponse.json({
      success: true,
      data: {
        names,
        pageInfo
      }
    });

  } catch (error) {
    console.error('Names API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch names',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}