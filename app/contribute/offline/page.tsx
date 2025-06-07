'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { CONFIG, formatFileSize, isValidAudioType, isFileSizeValid } from '@/lib/config'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}

export default function OfflineContributePage() {
  const { data: session } = useSession()
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [nameLists, setNameLists] = useState<any[]>([])
  const [loadingNameLists, setLoadingNameLists] = useState(true)

  // Load name lists
  useEffect(() => {
    const loadNameLists = async () => {
      try {
        const response = await fetch('/api/namelists')
        if (response.ok) {
          const data = await response.json()
          setNameLists(data.nameLists || [])
        }
      } catch (error) {
        console.error('Failed to load name lists:', error)
      } finally {
        setLoadingNameLists(false)
      }
    }

    loadNameLists()
  }, [])


// Update the handleFiles function:
const handleFiles = (files: FileList | null) => {
  console.log('handleFiles called with:', files)
  if (!files) return

  const validFiles: UploadedFile[] = []
  let hasErrors = false
  
  Array.from(files).forEach((file) => {
    console.log('Processing file:', file.name, file.type, file.size)
    
    // Validate file type
    if (!isValidAudioType(file.type)) {
      console.log('Invalid file type:', file.type)
      setError(`Invalid file type: ${file.name} (${file.type}). Please upload audio files only.`)
      hasErrors = true
      return
    }

    // Validate file size
    if (!isFileSizeValid(file.size)) {
      console.log('File too large:', file.size)
      setError(`File too large: ${file.name} is ${formatFileSize(file.size)}. Maximum size is ${CONFIG.MAX_FILE_SIZE_MB}MB. Please compress your audio file or split it into smaller segments.`)
      hasErrors = true
      return
    }

    console.log('File validated, adding to list')
    validFiles.push({
      file,
      id: Date.now().toString() + Math.random().toString(36),
      status: 'pending',
      progress: 0
    })
  })

  if (validFiles.length > 0) {
    setUploadedFiles(prev => [...prev, ...validFiles])
  }
  
  if (!hasErrors) {
    setError('')
  }
}

// Update the uploadFile function timeout:
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), CONFIG.UPLOAD_TIMEOUT_MS)

// Remove the formatFileSize function since it's now in config
// Keep only the component-specific logic
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

const uploadFile = async (uploadedFile: UploadedFile) => {
  console.log('Starting upload for:', uploadedFile.file.name)
  
  setUploadedFiles(prev => 
    prev.map(f => f.id === uploadedFile.id 
      ? { ...f, status: 'uploading', progress: 0 } 
      : f
    )
  )

  try {
    const formData = new FormData()
    formData.append('audio', uploadedFile.file)
    formData.append('title', `Offline Recording - ${uploadedFile.file.name}`)
    formData.append('nameListId', nameLists[0]?.id || CONFIG.TEMP_NAME_LIST_ID)

    // To this (which will use the real ID from your database):
    if (nameLists.length > 0) {
      formData.append('nameListId', nameLists[0].id)
    } else {
      formData.append('nameListId', CONFIG.TEMP_NAME_LIST_ID)
    }
    console.log('FormData prepared, making request...')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

const response = await fetch('/api/recordings/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    console.log('Response received - status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('Upload successful:', data)
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id 
          ? { ...f, status: 'completed', progress: 100 } 
          : f
        )
      )
    } else {
      const errorData = await response.json()
      console.error('Upload failed:', errorData)
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id 
          ? { ...f, status: 'error', error: errorData.error || 'Upload failed' } 
          : f
        )
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    setUploadedFiles(prev => 
      prev.map(f => f.id === uploadedFile.id 
        ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Network error' } 
        : f
      )
    )
  }
}
   

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadAll = () => {
    uploadedFiles
      .filter(f => f.status === 'pending')
      .forEach(uploadFile)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!session) {
    return <Container><Typography>Loading...</Typography></Container>
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Offline Contribution
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Download name lists, record at your own pace, and upload your audio files
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Download Name Lists */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Step 1: Download Name Lists
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Download PDF files with names to read. Record yourself reading each name clearly.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loadingNameLists ? (
                <Typography>Loading name lists...</Typography>
              ) : nameLists.length > 0 ? (
                nameLists.map((nameList) => (
                  <Button
                    key={nameList.id}
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    href={`/api/namelists/${nameList.id}/pdf`}
                    target="_blank"
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Download {nameList.title} ({JSON.parse(nameList.names).length} names)
                  </Button>
                ))
              ) : (
                <Alert severity="info">No name lists available yet.</Alert>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Step 2: Upload Your Recordings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Drag and drop your audio files here, or click to select files.
              Supported formats: MP3, WAV, MP4, WebM, OGG (Max 50MB each)
            </Typography>

            {/* Drop Zone */}
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: dragActive ? 'action.hover' : 'background.default',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drop audio files here or click to browse
              </Typography>
              <Typography variant="body2" color="text.secondary">
                MP3, WAV, MP4, WebM, OGG files up to 50MB
              </Typography>
            </Box>

            <input
              id="file-input"
              type="file"
              multiple
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </CardContent>
        </Card>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Uploaded Files ({uploadedFiles.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={uploadAll}
                  disabled={uploadedFiles.every(f => f.status !== 'pending')}
                >
                  Upload All
                </Button>
              </Box>

              <List>
                {uploadedFiles.map((uploadedFile) => (
                  <ListItem key={uploadedFile.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <AudioFileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={uploadedFile.file.name}
                      secondary={formatFileSize(uploadedFile.file.size)}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={uploadedFile.status.toUpperCase()}
                        color={
                          uploadedFile.status === 'completed' ? 'success' :
                          uploadedFile.status === 'error' ? 'error' :
                          uploadedFile.status === 'uploading' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                      {uploadedFile.status === 'pending' && (
                        <Button size="small" onClick={() => uploadFile(uploadedFile)}>
                          Upload
                        </Button>
                      )}
                      {uploadedFile.status === 'completed' && (
                        <CheckCircleIcon color="success" />
                      )}
                      <IconButton size="small" onClick={() => removeFile(uploadedFile.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    {uploadedFile.status === 'uploading' && (
                      <LinearProgress sx={{ width: 100, ml: 1 }} />
                    )}
                  </ListItem>
                ))}
              </List>
              {/* Debug section - temporary */}
<Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
  <Typography variant="body2" gutterBottom>Debug Info:</Typography>
  <Typography variant="caption">Files selected: {uploadedFiles.length}</Typography>
  <br />
  <Typography variant="caption">Name lists loaded: {nameLists.length}</Typography>
  <br />
  {uploadedFiles.length > 0 && (
    <Button 
      size="small" 
      onClick={() => {
        console.log('Debug upload button clicked')
        console.log('Upload files:', uploadedFiles)
        if (uploadedFiles.length > 0) {
          uploadFile(uploadedFiles[0])
        }
      }}
      sx={{ mt: 1 }}
    >
      Debug Upload First File
    </Button>
  )}
</Box>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Container>
  )
}