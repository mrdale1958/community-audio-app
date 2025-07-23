import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recording = await prisma.recording.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        nameList: {
          select: {
            id: true,
            title: true,
            pageNumber: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    return NextResponse.json(recording);
  } catch (error) {
    console.error('Error fetching recording:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recording' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the recording
    const recording = await prisma.recording.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Delete the file from filesystem
    try {
      const filePath = join(process.cwd(), 'uploads', recording.fileName);
      await unlink(filePath);
    } catch (fileError) {
      console.warn('Could not delete file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.recording.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return NextResponse.json(
      { error: 'Failed to delete recording' },
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

    const body = await request.json();
    const { notes, status } = body;

    // Find the recording
    const recording = await prisma.recording.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Update the recording
    const updatedRecording = await prisma.recording.update({
      where: { id: params.id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      },
      include: {
        nameList: {
          select: {
            id: true,
            title: true,
            pageNumber: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRecording);
  } catch (error) {
    console.error('Error updating recording:', error);
    return NextResponse.json(
      { error: 'Failed to update recording' },
      { status: 500 }
    );
  }
}