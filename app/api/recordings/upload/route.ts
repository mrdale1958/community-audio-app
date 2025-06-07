import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { CONFIG } from '@/lib/config'

export async function POST(request: NextRequest) {
  console.log('Upload API called')
  console.log('DATABASE_URL available:', !!process.env.DATABASE_URL)
  
  try {
    console.log('Checking session...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session found for user:', session.user.id)

    console.log('Parsing form data...')
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const nameListId = formData.get('nameListId') as string
    const title = formData.get('title') as string
    const duration = parseFloat(formData.get('duration') as string)

    console.log('Form data parsed:', {
      fileName: audioFile?.name,
      fileSize: audioFile?.size,
      mimeType: audioFile?.type,
      nameListId,
      title,
      duration
    })

    if (!audioFile) {
      console.log('No audio file provided')
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file size server-side
    if (audioFile.size > CONFIG.MAX_FILE_SIZE_BYTES) {
      console.log('File too large:', audioFile.size)
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${CONFIG.MAX_FILE_SIZE_MB}MB` 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    console.log('Checking uploads directory...')
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory...')
      await mkdir(uploadsDir, { recursive: true })
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = audioFile.name.split('.').pop() || 'wav'
    const fileName = `recording_${timestamp}_${session.user.id}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    console.log('Saving file to:', filePath)

    // Save file to disk
    try {
      const bytes = await audioFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      console.log('File saved successfully to disk')
    } catch (fileError) {
      console.error('File save error:', fileError)
      return NextResponse.json({ 
        error: 'Failed to save file to disk' 
      }, { status: 500 })
    }

    // Save to database
   // Save to database
console.log('Creating database record...')
try {
  // First, verify the nameListId exists
  let finalNameListId = nameListId || CONFIG.TEMP_NAME_LIST_ID
  
  // In the database save section, replace the temp list creation with:
if (finalNameListId === CONFIG.TEMP_NAME_LIST_ID) {
  const tempList = await prisma.nameList.findUnique({
    where: { id: CONFIG.TEMP_NAME_LIST_ID }
  })
  
  if (!tempList) {
    console.log('Creating temp name list...')
    // Create with a proper cuid format like your existing record
    const tempListRecord = await prisma.nameList.create({
      data: {
        title: 'Temporary List',
        pageNumber: 0,
        names: JSON.stringify(['Temporary names for offline uploads']),
        totalNames: 1,
        category: 'Temporary',
      }
    })
    finalNameListId = tempListRecord.id
    console.log('Created temp list with ID:', finalNameListId)
  }
}
  
  // Check if temp name list exists, create if not
  if (finalNameListId === CONFIG.TEMP_NAME_LIST_ID) {
    const tempList = await prisma.nameList.findUnique({
      where: { id: CONFIG.TEMP_NAME_LIST_ID }
    })
    
    if (!tempList) {
      console.log('Creating temp name list...')
      await prisma.nameList.create({
        data: {
          id: CONFIG.TEMP_NAME_LIST_ID,
          title: 'Temporary List',
          pageNumber: 0,
          names: JSON.stringify(['Temporary names for offline uploads']),
          totalNames: 1,
          category: 'Temporary',
        }
      })
    }
  }

  console.log('Using nameListId:', finalNameListId)
  console.log('Using userId:', session.user.id)

  const recording = await prisma.recording.create({
    data: {
      title: title || `Recording ${new Date().toLocaleDateString()}`,
      fileName,
      filePath: `uploads/${fileName}`,
      fileSize: audioFile.size,
      mimeType: audioFile.type,
      duration: duration || 0,
      recordingMethod: 'OFFLINE_UPLOAD',
      status: 'UPLOADED',
      userId: session.user.id,
      nameListId: finalNameListId,
      recordedAt: new Date(),
    }
  })

  console.log('Database record created successfully:', recording.id)
  // ... rest stays the same
      return NextResponse.json({ 
        success: true, 
        recordingId: recording.id,
        fileName: fileName,
        message: 'Recording saved successfully!' 
      })

    } catch (dbError) {
      console.error('Database save failed:', dbError)
      
      // File was saved but database failed
      return NextResponse.json({ 
        success: false,
        message: 'File uploaded but database save failed',
        error: 'Database error',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}