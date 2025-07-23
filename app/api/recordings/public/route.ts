import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get approved recordings only for public playback
    const recordings = await prisma.recording.findMany({
      where: {
        status: 'APPROVED'
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        fileSize: true,
        duration: true,
        method: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true
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
    console.error('Error fetching public recordings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}