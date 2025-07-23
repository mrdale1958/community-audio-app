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

    const { role } = await request.json()
    const userId = params.id

    if (!['CONTRIBUTOR', 'OBSERVER', 'MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Prevent users from demoting themselves if they're the only admin
    if (session.user.id === userId && session.user.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last admin user' },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Error updating user role:', error)
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

    const userId = params.id

    // Prevent admin from deleting themselves
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Prevent deleting the last admin
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (userToDelete?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        )
      }
    }

    // Get all recordings to delete their files
    const userRecordings = await prisma.recording.findMany({
      where: { userId },
      select: { filename: true }
    })

    // Delete user and all related data (cascade will handle recordings)
    await prisma.user.delete({
      where: { id: userId }
    })

    // Delete audio files from disk
    const uploadsDir = join(process.cwd(), 'uploads')
    for (const recording of userRecordings) {
      try {
        await unlink(join(uploadsDir, recording.filename))
      } catch (fileError) {
        console.warn('Could not delete file:', recording.filename, fileError)
        // Continue even if some files can't be deleted
      }
    }

    return NextResponse.json({
      success: true,
      message: `User deleted successfully along with ${userRecordings.length} recordings`
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}