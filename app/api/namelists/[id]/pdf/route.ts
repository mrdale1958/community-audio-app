import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jsPDF from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const nameListId = params.id

    // Get the name list from database
    const nameList = await prisma.nameList.findUnique({
      where: { id: nameListId }
    })

    if (!nameList) {
      return NextResponse.json(
        { error: 'Name list not found' },
        { status: 404 }
      )
    }

    // Parse the names JSON
    const names = JSON.parse(nameList.names) as string[]

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
    pdf.text(nameList.title, margin, y)
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

    // Names
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')

    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      
      // Check if we need a new page
      if (y > pageHeight - margin - lineHeight) {
        pdf.addPage()
        y = margin
        
        // Add page header
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'italic')
        pdf.text(`${nameList.title} (continued)`, margin, y)
        y += 15
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
      }

      // Add name with number
      const nameText = `${i + 1}. ${name}`
      pdf.text(nameText, margin, y)
      y += lineHeight + 2 // Extra spacing between names
    }

    // Add footer with metadata
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text(
        `Community Audio Recording Project - ${nameList.title} - Page ${i} of ${totalPages}`,
        margin,
        pageHeight - 10
      )
      
      if (nameList.pageNumber) {
        pdf.text(
          `List Page: ${nameList.pageNumber}`,
          pageWidth - margin - 30,
          pageHeight - 10
        )
      }
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nameList.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
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