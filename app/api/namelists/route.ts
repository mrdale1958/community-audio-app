import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pageSplitter, type OriginalPage } from '@/lib/pageSplitter'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all names from DB, treat as source list
    const nameLists = await prisma.nameList.findMany({
      orderBy: { pageNumber: 'asc' }
    })

    // Parse and flatten all names into one array
    const allNames: OriginalPage[] = nameLists.map(list => ({
      id: list.id,
      title: list.title,
      names: JSON.parse(list.names),
      pageNumber: list.pageNumber || 0
    }))

    // Use pageSplitter to create synthetic pages (chunks of 20)
    const splitPages = pageSplitter.splitPages(allNames)

    // Add statistics for debugging
    const stats = pageSplitter.getStats(allNames)
    console.log('Page split stats:', stats)

    return NextResponse.json({
      pages: splitPages,
      stats
    })

  } catch (error) {
    console.error('Error fetching name lists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow admins/managers to add names to the source list
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, names, pageNumber } = body

    if (!title || !names || !Array.isArray(names)) {
      return NextResponse.json(
        { error: 'Invalid input: title and names array are required' },
        { status: 400 }
      )
    }

    // Add a new source list (not a page)
    const nameList = await prisma.nameList.create({
      data: {
        title,
        names: JSON.stringify(names),
        pageNumber: pageNumber || null
      }
    })

    return NextResponse.json({
      ...nameList,
      names: JSON.parse(nameList.names)
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating name list:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}