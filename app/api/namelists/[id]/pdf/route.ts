import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the name list
    const nameList = await prisma.nameList.findUnique({
      where: { id: params.id }
    })

    if (!nameList) {
      return NextResponse.json({ error: 'Name list not found' }, { status: 404 })
    }

    // Parse the names
    let names: string[]
    try {
      names = JSON.parse(nameList.names) as string[]
    } catch (e) {
      return NextResponse.json({ error: 'Invalid name list format' }, { status: 400 })
    }

    // Create PDF with better settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // Set default font
    doc.setFont('helvetica')
    
    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Read My Name', 20, 25)
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text(nameList.title || 'Name List', 20, 35)
    
    doc.setFontSize(12)
    doc.text(`Page ${nameList.pageNumber || 1}`, 20, 45)
    doc.text(`Total Names: ${names.length}`, 20, 52)
    
    // Instructions
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Instructions:', 20, 65)
    doc.setFont('helvetica', 'normal')
    doc.text('• Read each name clearly and slowly', 25, 72)
    doc.text('• Pause briefly between names', 25, 78)
    doc.text('• Record in a quiet environment', 25, 84)
    doc.text('• Upload your recording at the website', 25, 90)
    
    // Names section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Names to Read:', 20, 105)
    
    // Names list
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    let yPosition = 120
    
    names.forEach((name, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 25
      }
      
      // Add the name with number
      doc.text(`${index + 1}. ${name}`, 25, yPosition)
      yPosition += 8 // Smaller spacing
    })
    
    // Add footer to all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Generated: ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
        20,
        287
      )
    }

    // Generate PDF as Uint8Array
    const pdfBytes = doc.output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfBytes)
    
    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(nameList.title || 'namelist').replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF generation failed', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}