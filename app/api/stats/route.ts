// app/api/stats/route.ts - Comprehensive statistics endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive statistics from the database
    const [
      totalNames,
      totalRecordings,
      approvedRecordings,
      pagesWithRecordings,
      recordingsByStatus
    ] = await Promise.all([
      // Get total names count (static since migration is complete)
      Promise.resolve(91897), // Direct count - much faster than DB query
      
      // Total recordings count
      prisma.recording.count(),
      
      // Approved recordings count
      prisma.recording.count({
        where: {
          status: 'APPROVED'
        }
      }),
      
      
      // Pages that have at least one recording
      prisma.nameList.count({
        where: {
          recordings: {
            some: {}
          }
        }
      }),
      
      // Recording counts by status
      prisma.recording.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ]);

    // Calculate total pages based on 20 names per page
    const totalSplitPages = Math.ceil(totalNames / 20);

    const completionPercentage = totalNames > 0 ? (approvedRecordings / totalNames) * 100 : 0;
    const pagesCompletionPercentage = totalSplitPages > 0 ? (pagesWithRecordings / totalSplitPages) * 100 : 0;

    // Format recording status breakdown
    const statusBreakdown = recordingsByStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalNames,
      totalRecordings,
      approvedRecordings,
      totalPages: totalSplitPages, // Use split page count
      pagesWithRecordings,
      remainingNames: totalNames - approvedRecordings,
      completionPercentage: Math.round(completionPercentage * 10) / 10, // Round to 1 decimal
      pagesCompletionPercentage: Math.round(pagesCompletionPercentage * 10) / 10,
      recordingStatus: {
        pending: statusBreakdown.pending || 0,
        approved: statusBreakdown.approved || 0,
        rejected: statusBreakdown.rejected || 0,
        archived: statusBreakdown.archived || 0,
      },
      // Additional metrics
      averageRecordingsPerPage: totalSplitPages > 0 ? Math.round((totalRecordings / totalSplitPages) * 10) / 10 : 0,
      pagesNeedingRecordings: totalSplitPages - pagesWithRecordings,
      averageNamesPerPage: totalSplitPages > 0 ? Math.round((totalNames / totalSplitPages) * 10) / 10 : 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        lastUpdated: new Date().toISOString(),
        targetAchieved: completionPercentage >= 100,
      }
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}