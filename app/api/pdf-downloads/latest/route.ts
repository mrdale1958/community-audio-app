import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pageSplitter, type OriginalPage } from '@/lib/pageSplitter'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's most recent PDF download
    const latestDownload = await prisma.pdfDownload.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        downloadedAt: 'desc'
      }
    })

    if (!latestDownload) {
      return NextResponse.json({ downloadedPage: null })
    }

    // If it's a synthetic page ID, we need to reconstruct the page data
    if (latestDownload.nameListId.startsWith('synthetic-')) {
      const pageId = latestDownload.nameListId.replace('synthetic-', '')
      
      // Get all name lists to find the synthetic page
      const nameLists = await prisma.nameList.findMany({
        orderBy: {
          pageNumber: 'asc'
        }
      })

      // Convert to OriginalPage format
      const originalPages: OriginalPage[] = nameLists.map(list => ({
        id: list.id,
        title: list.title,
        names: JSON.parse(list.names),
        pageNumber: list.pageNumber || 0
      }))

      // Get the specific split page
      const splitPage = pageSplitter.getSplitPageById(originalPages, pageId)
      
      if (!splitPage) {
        return NextResponse.json({ downloadedPage: null })
      }

      return NextResponse.json({ 
        downloadedPage: splitPage,
        downloadedAt: latestDownload.downloadedAt
      })
    } else {
      // Handle actual database ID
      const nameList = await prisma.nameList.findUnique({
        where: { id: latestDownload.nameListId }
      })

      if (!nameList) {
        return NextResponse.json({ downloadedPage: null })
      }

      // Convert to the same format as split pages
      const parsedNames = JSON.parse(nameList.names)
      const names = Array.isArray(parsedNames) 
        ? parsedNames.map(name => typeof name === 'string' ? name : name.name)
        : []

      const page = {
        id: nameList.id,
        originalId: nameList.id,
        title: nameList.title,
        names,
        pageNumber: nameList.pageNumber || 0,
        subPage: 'A',
        displayTitle: nameList.title,
        totalNamesInOriginal: names.length
      }

      return NextResponse.json({ 
        downloadedPage: page,
        downloadedAt: latestDownload.downloadedAt
      })
    }

  } catch (error) {
    console.error('Error fetching latest PDF download:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}