import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get public statistics (no authentication required)
    const [
      totalRecordings,
      approvedRecordings,
      pendingRecordings,
      totalContributors,
      totalNameLists,
      recordingStats,
      recentApprovals,
      recentSubmissions,
      topContributors,
      methodBreakdown
    ] = await Promise.all([
      // Basic counts
      prisma.recording.count(),
      prisma.recording.count({ where: { status: 'APPROVED' } }),
      prisma.recording.count({ where: { status: 'PENDING' } }),
      
      // Unique contributors
      prisma.user.count({
        where: {
          recordings: {
            some: {}
          }
        }
      }),
      
      // Total name lists
      prisma.nameList.count(),
      
      // Aggregated recording data
      prisma.recording.aggregate({
        _sum: {
          duration: true
        },
        where: {
          status: 'APPROVED'
        }
      }),
      
      // Recent approved recordings for activity feed
      prisma.recording.findMany({
        where: { status: 'APPROVED' },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { name: true }
          },
          nameList: {
            select: { title: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),
      
      // Recent submissions for activity feed
      prisma.recording.findMany({
        where: { status: { in: ['PENDING', 'APPROVED'] } },
        select: {
          id: true,
          createdAt: true,
          status: true,
          user: {
            select: { name: true }
          },
          nameList: {
            select: { title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Top contributors
      prisma.user.findMany({
        select: {
          name: true,
          _count: {
            select: {
              recordings: {
                where: { status: 'APPROVED' }
              }
            }
          }
        },
        where: {
          recordings: {
            some: { status: 'APPROVED' }
          }
        },
        orderBy: {
          recordings: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // Method breakdown
      prisma.recording.groupBy({
        by: ['method'],
        _count: {
          method: true
        },
        where: {
          status: 'APPROVED'
        }
      })
    ])

    // Combine recent activity from approvals and submissions
    const combinedActivity = [
      ...recentApprovals.map(r => ({
        id: r.id,
        type: 'approval' as const,
        contributorName: r.user.name,
        nameListTitle: r.nameList.title,
        createdAt: r.updatedAt.toISOString()
      })),
      ...recentSubmissions.map(r => ({
        id: r.id,
        type: 'recording' as const,
        contributorName: r.user.name,
        nameListTitle: r.nameList.title,
        createdAt: r.createdAt.toISOString()
      }))
    ]

    // Sort by date and take most recent
    const recentActivity = combinedActivity
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15)

    // Format top contributors
    const formattedTopContributors = topContributors.map(user => ({
      name: user.name,
      recordingCount: user._count.recordings
    }))

    // Format method breakdown
    const methodStats = {
      live: methodBreakdown.find(m => m.method === 'LIVE')?._count.method || 0,
      upload: methodBreakdown.find(m => m.method === 'UPLOAD')?._count.method || 0
    }

    const stats = {
      totalRecordings,
      approvedRecordings,
      pendingRecordings,
      totalContributors,
      totalNameLists,
      totalDuration: recordingStats._sum.duration || 0,
      recentActivity,
      topContributors: formattedTopContributors,
      methodBreakdown: methodStats
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' // Cache for 5 minutes
      }
    })

  } catch (error) {
    console.error('Error fetching public stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}