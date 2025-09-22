import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pageSplitter, type OriginalPage } from '@/lib/pageSplitter'
import { appendFile } from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    await appendFile(
      '/tmp/api-debug.log',
      `[${new Date().toISOString()}] Request received: ${JSON.stringify(request)}\n`
    );

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    await appendFile(
      '/tmp/api-debug.log',
      `[${new Date().toISOString()}] Session user ID: ${session.user.id}\n`
    );

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const nameListId = formData.get('nameListId') as string;
    const method = formData.get('method') as string;
    const duration = formData.get('duration') as string;
    await appendFile(
      '/tmp/api-debug.log',
      `[${new Date().toISOString()}] Form Data - nameListId: ${nameListId}, method: ${method}, duration: ${duration}\n`
    );

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
    await appendFile(
      '/tmp/api-debug.log',
      `[${new Date().toISOString()}] filename: ${filename}\n`
    );

    // Ensure uploads directory exists
    const uploadsDir = process.env.UPLOAD_PATH || join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    await appendFile(
      '/tmp/api-debug.log',
      `[${new Date().toISOString()}] audioFile: ${JSON.stringify(audioFile)}\n`
    );
    await appendFile(
      '/tmp/api-debug.log',
      `[${new Date().toISOString()}] audioFile.size: ${audioFile.size}\n`
    );

    // Save file to disk
    const filePath = join(uploadsDir, filename);
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await appendFile(
      '/tmp/api-debug.log',
      `[${new Date().toISOString()}] buffer.length: ${buffer.length}\n`
    );
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

    return NextResponse.json({
      success: true,
      recording: {
        ...recording,
        syntheticPage: splitPage
      }
    }, { status: 201 });

  } catch (error) {
    await appendFile('/tmp/api-debug.log', `[${new Date().toISOString()}] Debug info: ${JSON.stringify({ error })}\n`);
    
    // You can also log errors here if needed
    // await appendFile('/tmp/api-debug.log', `[${new Date().toISOString()}] Upload error: ${error}\n`);
    
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

