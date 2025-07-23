import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const recordings = await prisma.recording.findMany({
      select: {
        id: true,
        filename: true,
        originalName: true,
        fileSize: true,
        duration: true,
        status: true,
        method: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        nameList: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(recordings)

  } catch (error) {
    console.error('Error fetching admin recordings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}