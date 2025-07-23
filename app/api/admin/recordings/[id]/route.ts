import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status } = await request.json()
    const recordingId = params.id

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const recording = await prisma.recording.update({
      where: { id: recordingId },
      data: { status },
      select: {
        id: true,
        status: true,
        originalName: true
      }
    })

    return NextResponse.json({
      success: true,
      recording
    })

  } catch (error) {
    console.error('Error updating recording status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const recordingId = params.id

    // Get recording details before deletion
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      select: { filename: true }
    })

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    // Delete from database
    await prisma.recording.delete({
      where: { id: recordingId }
    })

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), 'uploads', recording.filename)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('Could not delete file:', recording.filename, fileError)
      // Continue even if file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting recording:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}