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

    const userId = session.user.id;

    const [total, pending, approved, rejected, processing] = await Promise.all([
      prisma.recording.count({ where: { userId } }),
      prisma.recording.count({ where: { userId, status: 'PENDING' } }),
      prisma.recording.count({ where: { userId, status: 'APPROVED' } }),
      prisma.recording.count({ where: { userId, status: 'REJECTED' } }),
      prisma.recording.count({ where: { userId, status: 'PROCESSING' } }),
    ]);

    const recordings = await prisma.recording.findMany({
      where: { 
        userId,
        duration: { not: null },
      },
      select: { duration: true },
    });

    const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgDuration = recordings.length > 0 ? totalDuration / recordings.length : 0;

    return NextResponse.json({
      total,
      pending,
      approved,
      rejected,
      processing,
      totalDuration,
      avgDuration,
    });
  } catch (error) {
    console.error('Error fetching recording stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recording stats' },
      { status: 500 }
    );
  }
}