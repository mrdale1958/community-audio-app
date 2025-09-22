import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pageSplitter, type OriginalPage } from '@/lib/pageSplitter'
import { appendFile } from 'fs/promises'
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('Request received', { request: { method: request.method, url: request.url } });

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    logger.info('Session user ID', { userId: session.user.id });

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const nameListId = formData.get('nameListId') as string;
    const method = formData.get('method') as string;
    const duration = formData.get('duration') as string;
    logger.info('Form Data', { nameListId, method, duration });

    // Validate required fields
    if (!audioFile || !nameListId || !method) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, nameListId, method' },
        { status: 400 }
      );
    }

    // Validate synthetic page exists
    if (!nameListId.startsWith('page-')) {
      return NextResponse.json(
        { error: 'Invalid page ID' },
        { status: 400 }
      );
    }
    const nameLists = await prisma.nameList.findMany({ orderBy: { pageNumber: 'asc' } });
    const originalPages: OriginalPage[] = nameLists.map(list => ({
      id: list.id,
      title: list.title,
      names: JSON.parse(list.names),
      pageNumber: list.pageNumber || 0
    }));
    const splitPage = pageSplitter.getSplitPageById(originalPages, nameListId);
    if (!splitPage) {
      return NextResponse.json(
        { error: 'Synthetic page not found' },
        { status: 404 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = audioFile.name.split('.').pop() || 'webm';
    const filename = `recording-${timestamp}-${session.user.id}.${fileExtension}`;
    logger.info('filename', { filename });

    // Ensure uploads directory exists
    const uploadsDir = process.env.UPLOAD_PATH || join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    logger.info('audioFile.size', { size: audioFile.size });

    // Save file to disk
    const filePath = join(uploadsDir, filename);
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    logger.info('buffer.length', { length: buffer.length });
    await writeFile(filePath, buffer);

    // Save recording metadata to database
    const recording = await prisma.recording.create({
      data: {
        filename,
        originalFilename: audioFile.name,
        filesize: audioFile.size,
        duration: duration ? parseInt(duration) : null,
        mimetype: audioFile.type,
        method,
        status: 'PENDING',
        userId: session.user.id,
        nameListId, // This is now a synthetic page ID
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Find the next synthetic page for the user
    // (You may want to filter out pages the user has already recorded)
    const recordedNameListIds = await prisma.recording.findMany({
      where: { userId: session.user.id },
      select: { nameListId: true }
    });
    const recordedIdsSet = new Set(recordedNameListIds.map(r => r.nameListId));

    // Find the first synthetic page not yet recorded by this user
    const nextPage = originalPages.find(page => !recordedIdsSet.has(page.id));

    return NextResponse.json({
      success: true,
      recording: {
        ...recording,
        syntheticPage: splitPage
      },
      nextPage: nextPage || null // Send the next page (or null if none left)
    }, { status: 201 });

  } catch (error) {
    logger.error('Upload error', { error });
    
    // Handle specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOSPC') {
        return NextResponse.json(
          { error: 'Insufficient storage space' },
          { status: 507 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

