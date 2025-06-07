import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('Test upload API called')
  
  try {
    console.log('Parsing form data...')
    const formData = await request.formData()
    console.log('Form data parsed successfully')
    
    const audioFile = formData.get('audio') as File
    console.log('Audio file:', audioFile?.name, audioFile?.size, audioFile?.type)
    
    if (!audioFile) {
      console.log('No audio file found')
      return NextResponse.json({ error: 'No audio file' }, { status: 400 })
    }
    
    console.log('File received successfully')
    return NextResponse.json({ 
      success: true, 
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      message: 'File upload test successful!' 
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({ 
      error: 'Test upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}