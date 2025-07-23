import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get comprehensive project statistics
    const [
      totalRecordings,
      pendingRecordings,
      approvedRecordings,
      rejectedRecordings,
      totalUsers,
      totalNameLists,
      recordingStats
    ] = await Promise.all([
      prisma.recording.count(),
      prisma.recording.count({ where: { status: 'PENDING' } }),
      prisma.recording.count({ where: { status: 'APPROVED' } }),
      prisma.recording.count({ where: { status: 'REJECTED' } }),
      prisma.user.count(),
      prisma.nameList.count(),
      prisma.recording.aggregate({
        _sum: {
          duration: true,
          fileSize: true
        }
      })
    ])

    const stats = {
      totalRecordings,
      pendingRecordings,
      approvedRecordings,
      rejectedRecordings,
      totalUsers,
      totalNameLists,
      totalDuration: recordingStats._sum.duration || 0,
      totalFileSize: recordingStats._sum.fileSize || 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}