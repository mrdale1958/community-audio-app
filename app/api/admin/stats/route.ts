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

    // Check if user has admin access
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get basic counts
    const [
      totalRecordings,
      totalUsers,
      pendingRecordings,
      approvedRecordings,
      rejectedRecordings,
      processingRecordings,
    ] = await Promise.all([
      prisma.recording.count(),
      prisma.user.count(),
      prisma.recording.count({ where: { status: 'PENDING' } }),
      prisma.recording.count({ where: { status: 'APPROVED' } }),
      prisma.recording.count({ where: { status: 'REJECTED' } }),
      prisma.recording.count({ where: { status: 'PROCESSING' } }),
    ]);

    // Get duration stats
    const recordings = await prisma.recording.findMany({
      where: { duration: { not: null } },
      select: { duration: true, fileSize: true, createdAt: true },
    });

    const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgDuration = recordings.length > 0 ? totalDuration / recordings.length : 0;
const storageUsed = recordings.reduce((sum, r) => sum + (r.fileSize || 0), 0);

    // Get time-based counts
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [recordingsToday, recordingsThisWeek, recordingsThisMonth] = await Promise.all([
      prisma.recording.count({ where: { createdAt: { gte: today } } }),
      prisma.recording.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.recording.count({ where: { createdAt: { gte: thisMonth } } }),
    ]);

    // Get top contributors
    const topContributors = await prisma.recording.groupBy({
      by: ['userId'],
      _count: { id: true },
      _sum: { duration: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topContributorsWithUser = await Promise.all(
      topContributors.map(async (contributor) => {
        const user = await prisma.user.findUnique({
          where: { id: contributor.userId },
          select: { id: true, name: true, email: true },
        });
        return {
          userId: contributor.userId,
          userName: user?.name || null,
          userEmail: user?.email || '',
          recordingCount: contributor._count.id,
          totalDuration: contributor._sum.duration || 0,
        };
      })
    );

    // Get status breakdown with percentages
    const statusBreakdown = [
      { status: 'PENDING', count: pendingRecordings },
      { status: 'APPROVED', count: approvedRecordings },
      { status: 'REJECTED', count: rejectedRecordings },
      { status: 'PROCESSING', count: processingRecordings },
    ].map(item => ({
      ...item,
      percentage: totalRecordings > 0 ? Math.round((item.count / totalRecordings) * 100) : 0,
    }));

    // Get method breakdown
    const [liveCount, uploadCount] = await Promise.all([
      prisma.recording.count({ where: { recordingMethod: 'LIVE' } }),
      prisma.recording.count({ where: { recordingMethod: 'UPLOAD' } }),
    ]);

    const methodBreakdown = [
      { method: 'LIVE', count: liveCount },
      { method: 'UPLOAD', count: uploadCount },
    ].map(item => ({
      ...item,
      percentage: totalRecordings > 0 ? Math.round((item.count / totalRecordings) * 100) : 0,
    }));

    const stats = {
      totalRecordings,
      totalUsers,
      pendingRecordings,
      approvedRecordings,
      rejectedRecordings,
      processingRecordings,
      totalDuration,
      avgDuration,
      storageUsed,
      recordingsToday,
      recordingsThisWeek,
      recordingsThisMonth,
      topContributors: topContributorsWithUser,
      statusBreakdown,
      methodBreakdown,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}