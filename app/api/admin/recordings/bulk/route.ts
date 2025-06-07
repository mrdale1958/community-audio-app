import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

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
    const { type, recordingIds, newStatus, queuePosition } = body;

    if (!type || !recordingIds || !Array.isArray(recordingIds) || recordingIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    let result: any = { success: true, affected: 0 };

    switch (type) {
      case 'APPROVE':
        const approveResult = await prisma.recording.updateMany({
          where: {
            id: { in: recordingIds },
          },
          data: {
            status: 'APPROVED',
            updatedAt: new Date(),
          },
        });
        result.affected = approveResult.count;
        break;

      case 'REJECT':
        const rejectResult = await prisma.recording.updateMany({
          where: {
            id: { in: recordingIds },
          },
          data: {
            status: 'REJECTED',
            updatedAt: new Date(),
          },
        });
        result.affected = rejectResult.count;
        break;

      case 'SET_STATUS':
        if (!newStatus) {
          return NextResponse.json({ error: 'New status is required' }, { status: 400 });
        }
        const statusResult = await prisma.recording.updateMany({
          where: {
            id: { in: recordingIds },
          },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        });
        result.affected = statusResult.count;
        break;

      case 'ADD_TO_QUEUE':
        // Get the current max position in the exhibition queue
        const maxPosition = await prisma.exhibitionQueue.aggregate({
          _max: {
            position: true,
          },
        });

        const startPosition = queuePosition || (maxPosition._max.position || 0) + 1;

        // Create exhibition queue entries for approved recordings
        const approvedRecordings = await prisma.recording.findMany({
          where: {
            id: { in: recordingIds },
            status: 'APPROVED',
          },
          select: { id: true },
        });

        const queueEntries = approvedRecordings.map((recording, index) => ({
          recordingId: recording.id,
          position: startPosition + index,
        }));

       if (queueEntries.length > 0) {
        try {
            await prisma.exhibitionQueue.createMany({
            data: queueEntries,
            });
        } catch (error) {
            // Handle duplicate entries - some may already exist
            console.warn('Some recordings may already be in queue:', error);
            
            // Add them one by one, skipping duplicates
            for (const entry of queueEntries) {
            try {
                await prisma.exhibitionQueue.create({
                data: entry,
                });
            } catch (duplicateError) {
                // Skip if already exists
                console.warn(`Recording ${entry.recordingId} already in queue`);
            }
            }
        }
    }

        result.affected = queueEntries.length;
        result.message = `Added ${queueEntries.length} recordings to exhibition queue`;
        break;

      case 'DELETE':
        // Get recordings to delete (for file cleanup)
        const recordingsToDelete = await prisma.recording.findMany({
          where: {
            id: { in: recordingIds },
          },
          select: { id: true, fileName: true },
        });

        // Delete files from filesystem
        const fileDeletePromises = recordingsToDelete.map(async (recording) => {
          try {
            const filePath = join(process.cwd(), 'uploads', recording.fileName);
            await unlink(filePath);
          } catch (fileError) {
            console.warn(`Could not delete file for recording ${recording.id}:`, fileError);
          }
        });

        await Promise.allSettled(fileDeletePromises);

        // Delete from database
        const deleteResult = await prisma.recording.deleteMany({
          where: {
            id: { in: recordingIds },
          },
        });

        result.affected = deleteResult.count;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}