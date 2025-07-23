import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const nameListId = formData.get('nameListId') as string
    const method = formData.get('method') as string
    const duration = formData.get('duration') as string

    if (!audioFile || !nameListId || !method) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, nameListId, method' },
        { status: 400 }
      )
    }

    // Validate nameList exists
    const nameList = await prisma.nameList.findUnique({
      where: { id: nameListId }
    })

    if (!nameList) {
      return NextResponse.json(
        { error: 'Name list not found' },
        { status: 404 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = audioFile.name.split('.').pop() || 'webm'
    const filename = `recording-${timestamp}-${session.user.id}.${fileExtension}`

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file to disk
    const filePath = join(uploadsDir, filename)
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save recording metadata to database
    const recording = await prisma.recording.create({
      data: {
        filename,
        originalName: audioFile.name,
        fileSize: audioFile.size,
        duration: duration ? parseInt(duration) : null,
        mimeType: audioFile.type,
        method,
        status: 'PENDING',
        userId: session.user.id,
        nameListId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        nameList: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      recording: {
        ...recording,
        nameList: {
          ...recording.nameList,
          names: JSON.parse(nameList.names)
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Handle specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOSPC') {
        return NextResponse.json(
          { error: 'Insufficient storage space' },
          { status: 507 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle file size limits and supported formats
export const config = {
  api: {
    bodyParser: false,
  },
}