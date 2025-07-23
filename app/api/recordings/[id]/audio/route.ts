import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync, existsSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id

    // Get recording metadata from database
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      select: {
        id: true,
        filename: true,
        status: true,
        mimeType: true
      }
    })

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    // For public playback, only serve approved recordings
    // (You might want to allow users to play their own recordings regardless of status)
    if (recording.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Recording not available for playback' },
        { status: 403 }
      )
    }

    // Construct file path
    const uploadsDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadsDir, recording.filename)

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`Audio file not found: ${filePath}`)
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = statSync(filePath)
    const fileSize = stats.size

    // Handle range requests for audio streaming
    const range = request.headers.get('range')
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = (end - start) + 1

      // Create read stream for the requested range
      const stream = createReadStream(filePath, { start, end })
      
      // Convert Node.js stream to Web Stream
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            controller.enqueue(new Uint8Array(buffer))
          })
          stream.on('end', () => {
            controller.close()
          })
          stream.on('error', (err) => {
            controller.error(err)
          })
        },
        cancel() {
          stream.destroy()
        }
      })

      return new NextResponse(readableStream, {
        status: 206, // Partial Content
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': recording.mimeType || 'audio/mpeg',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } else {
      // No range request - serve entire file
      const stream = createReadStream(filePath)
      
      // Convert Node.js stream to Web Stream
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            controller.enqueue(new Uint8Array(buffer))
          })
          stream.on('end', () => {
            controller.close()
          })
          stream.on('error', (err) => {
            controller.error(err)
          })
        },
        cancel() {
          stream.destroy()
        }
      })

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': recording.mimeType || 'audio/mpeg',
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

  } catch (error) {
    console.error('Audio streaming error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}