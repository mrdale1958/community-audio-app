import { NextRequest, NextResponse } from 'next/server'
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

    // Check current user role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, name: true, email: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow OBSERVER to upgrade to CONTRIBUTOR
    if (currentUser.role !== 'OBSERVER') {
      return NextResponse.json(
        { error: 'Only observers can upgrade to contributor status' },
        { status: 400 }
      )
    }

    // Update user role to CONTRIBUTOR
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'CONTRIBUTOR' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account upgraded to Contributor successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Account upgrade error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}