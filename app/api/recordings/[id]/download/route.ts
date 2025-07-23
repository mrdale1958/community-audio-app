import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createReadStream, existsSync } from 'fs';
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

    const filePath = join(process.cwd(), 'uploads', recording.fileName);
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
    }

    const stream = createReadStream(filePath);
    
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${recording.title}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}