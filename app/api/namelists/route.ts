import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const nameLists = await prisma.nameList.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse the JSON names for each list
    const nameListsWithParsedNames = nameLists.map(list => ({
      ...list,
      names: JSON.parse(list.names)
    }))

    return NextResponse.json(nameListsWithParsedNames)

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

    // Check if user has permission to create name lists
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