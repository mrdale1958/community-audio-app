import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nameLists = await prisma.nameList.findMany({
      orderBy: { pageNumber: 'asc' }
    })

    return NextResponse.json({ nameLists })

  } catch (error) {
    console.error('Failed to fetch name lists:', error)
    return NextResponse.json({ error: 'Failed to fetch name lists' }, { status: 500 })
  }
}