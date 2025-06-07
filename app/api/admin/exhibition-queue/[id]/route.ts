import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the queue entry
    const queueEntry = await prisma.exhibitionQueue.findUnique({
      where: { id: params.id },
    });

    if (!queueEntry) {
      return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
    }

    // Remove the queue entry
    await prisma.exhibitionQueue.delete({
      where: { id: params.id },
    });

    // Shift remaining items up to fill the gap
    await prisma.exhibitionQueue.updateMany({
      where: { position: { gt: queueEntry.position } },
      data: { position: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from exhibition queue:', error);
    return NextResponse.json(
      { error: 'Failed to remove from exhibition queue' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { position: newPosition } = body;

    if (!newPosition || newPosition < 1) {
      return NextResponse.json({ error: 'Valid position is required' }, { status: 400 });
    }

    // Find the queue entry
    const queueEntry = await prisma.exhibitionQueue.findUnique({
      where: { id: params.id },
    });

    if (!queueEntry) {
      return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
    }

    const oldPosition = queueEntry.position;

    if (oldPosition === newPosition) {
      return NextResponse.json(queueEntry);
    }

    // Get total count to validate position
    const totalCount = await prisma.exhibitionQueue.count();
    if (newPosition > totalCount) {
      return NextResponse.json({ error: 'Position out of range' }, { status: 400 });
    }

    // Use a transaction to handle the reordering
    await prisma.$transaction(async (tx) => {
      if (newPosition > oldPosition) {
        // Moving down: shift items between oldPosition and newPosition up
        await tx.exhibitionQueue.updateMany({
          where: {
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        // Moving up: shift items between newPosition and oldPosition down
        await tx.exhibitionQueue.updateMany({
          where: {
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
          },
          data: { position: { increment: 1 } },
        });
      }

      // Update the moved item to its new position
      await tx.exhibitionQueue.update({
        where: { id: params.id },
        data: { position: newPosition },
      });
    });

    // Return the updated queue entry
    const updatedEntry = await prisma.exhibitionQueue.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error reordering exhibition queue:', error);
    return NextResponse.json(
      { error: 'Failed to reorder exhibition queue' },
      { status: 500 }
    );
  }
}