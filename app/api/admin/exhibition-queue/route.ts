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

    const queue = await prisma.exhibitionQueue.findMany({
      include: {
        recording: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            nameList: {
              select: {
                id: true,
                title: true,
                pageNumber: true,
              },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(queue);
  } catch (error) {
    console.error('Error fetching exhibition queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exhibition queue' },
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

    // Check if user has admin access
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { recordingId, position } = body;

    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID is required' }, { status: 400 });
    }

    // Check if recording exists and is approved
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    if (recording.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Only approved recordings can be added to the exhibition queue' 
      }, { status: 400 });
    }

    // Check if recording is already in queue
    const existingQueueEntry = await prisma.exhibitionQueue.findFirst({
      where: { recordingId },
    });

    if (existingQueueEntry) {
      return NextResponse.json({ 
        error: 'Recording is already in the exhibition queue' 
      }, { status: 400 });
    }

    // Get the position to insert at
    let insertPosition = position;
    if (!insertPosition) {
      // Get the current max position
      const maxPosition = await prisma.exhibitionQueue.aggregate({
        _max: { position: true },
      });
      insertPosition = (maxPosition._max.position || 0) + 1;
    } else {
      // Shift existing items down to make room
      await prisma.exhibitionQueue.updateMany({
        where: { position: { gte: insertPosition } },
        data: { position: { increment: 1 } },
      });
    }

    // Create the queue entry
    const queueEntry = await prisma.exhibitionQueue.create({
      data: {
        recordingId,
        position: insertPosition,
      },
      include: {
        recording: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            nameList: {
              select: {
                id: true,
                title: true,
                pageNumber: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(queueEntry);
  } catch (error) {
    console.error('Error adding to exhibition queue:', error);
    return NextResponse.json(
      { error: 'Failed to add to exhibition queue' },
      { status: 500 }
    );
  }
}