import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pageSplitter, type OriginalPage } from '@/lib/pageSplitter'
import jsPDF from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: nameListId } = await params

    let names: string[];
    let title: string;
    let pageNumber: number | null = null;

    // Check if this is a synthetic page ID (e.g., "page-1") or actual database ID
    if (nameListId.startsWith('page-')) {
      // Handle synthetic page IDs from pageSplitter
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
      const splitPage = pageSplitter.getSplitPageById(originalPages, nameListId)
      
      if (!splitPage) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }

      // Convert names to strings (handle both string and object formats)
      names = splitPage.names.map(name => 
        typeof name === 'string' ? name : name.name
      )
      title = splitPage.displayTitle
      pageNumber = splitPage.pageNumber
    } else {
      // Handle actual database IDs
      const nameList = await prisma.nameList.findUnique({
        where: { id: nameListId }
      })

      if (!nameList) {
        return NextResponse.json(
          { error: 'Name list not found' },
          { status: 404 }
        )
      }

      // Parse the names JSON and convert to strings
      const parsedNames = JSON.parse(nameList.names)
      names = Array.isArray(parsedNames) 
        ? parsedNames.map(name => typeof name === 'string' ? name : name.name)
        : []
      title = nameList.title
      pageNumber = nameList.pageNumber
    }

    // Create PDF
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const lineHeight = 8
    let y = margin + 20

    // Title
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin, y)
    y += 15

    // Instructions
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    const instructions = [
      'Instructions for Recording:',
      '• Find a quiet space for recording',
      '• Speak clearly and at a moderate pace',
      '• Read each name as it appears (pronunciation may vary)',
      '• Leave a brief pause between names',
      '• Save your recording and upload it at: ' + (process.env.NEXTAUTH_URL || 'the website'),
      '',
      `This list contains ${names.length} names:`
    ]

    for (const instruction of instructions) {
      if (y > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }
      
      if (instruction === 'Instructions for Recording:') {
        pdf.setFont('helvetica', 'bold')
      } else {
        pdf.setFont('helvetica', 'normal')
      }
      
      pdf.text(instruction, margin, y)
      y += lineHeight
    }

    y += 10 // Extra space before names

    // Names in two columns
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')

    const columnWidth = (pageWidth - 3 * margin) / 2 // Two columns with margin between
    const leftColumnX = margin
    const rightColumnX = margin + columnWidth + margin
    const maxY = pageHeight - margin - 20 // Leave space for footer
    
    let leftY = y
    let rightY = y
    let currentColumn = 'left'
    
    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      
      if (currentColumn === 'left') {
        // Check if we need to switch to right column
        if (leftY > maxY) {
          currentColumn = 'right'
          rightY = y // Reset right column to top
        } else {
          pdf.text(name, leftColumnX, leftY)
          leftY += lineHeight + 1
          continue
        }
      }
      
      if (currentColumn === 'right') {
        // Check if right column is full (should not happen with 20 names)
        if (rightY > maxY) {
          // This shouldn't happen with proper sizing, but just in case
          pdf.addPage()
          leftY = margin + 20
          rightY = margin + 20
          currentColumn = 'left'
          i-- // Retry this name
          continue
        }
        
        pdf.text(name, rightColumnX, rightY)
        rightY += lineHeight + 1
        
        // Switch back to left column for next name
        currentColumn = 'left'
      }
    }

    // Add footer with metadata (should only be page 1)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.text(
      `Community Audio Recording Project - ${title}`,
      margin,
      pageHeight - 10
    )
    
    if (pageNumber) {
      pdf.text(
        `List Page: ${pageNumber}`,
        pageWidth - margin - 30,
        pageHeight - 10
      )
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
