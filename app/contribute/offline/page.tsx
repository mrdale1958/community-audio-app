'use client'

import React, { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material'
import {
  Upload,
  Download,
  AudioFile,
  PictureAsPdf,
  Delete,
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Refresh
} from '@mui/icons-material'

interface NameList {
  id: string
  title: string
  names: string[]
  pageNumber: number
}

interface UploadedFile {
  file: File
  nameListId: string
  nameListTitle: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface Recording {
  nameListId: string;
  // ...other fields if needed
}

export default function OfflineContributePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [currentNameList, setCurrentNameList] = useState<NameList | null>(null)
  const [allNameLists, setAllNameLists] = useState<NameList[]>([])
  const [unrecordedCount, setUnrecordedCount] = useState<number>(0)
  const [isReturningToDownloadedPage, setIsReturningToDownloadedPage] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load available name lists and find unrecorded page
  const loadNameLists = async () => {
    try {
      setIsLoading(true)
      
      // Fetch name lists, recordings, and latest PDF download in parallel
      const [nameListsResponse, recordingsResponse, latestDownloadResponse] = await Promise.all([
        fetch(apiUrl('/api/namelists')),
        fetch(apiUrl('/api/recordings')),
        fetch(apiUrl('/api/pdf-downloads/latest'))
      ])
      
      if (!nameListsResponse.ok) throw new Error('Failed to load name lists')
      if (!recordingsResponse.ok) throw new Error('Failed to load recordings')
      if (!latestDownloadResponse.ok) throw new Error('Failed to load download history')
      
      const nameListsData = await nameListsResponse.json()
      const recordingsData = await recordingsResponse.json()
      const latestDownloadData = await latestDownloadResponse.json()
      
      const nameLists = nameListsData.pages || []
      const existingRecordings = recordingsData.recordings || []
      
      setAllNameLists(nameLists)
      
      if (nameLists.length === 0) {
        setError('No name lists available. Please contact an administrator.')
        return
      }
      
      // Find unrecorded pages
      const recordedNameListIds = new Set(existingRecordings.map((r: Recording) => r.nameListId))
      const unrecordedPages = nameLists.filter((page: NameList) => !recordedNameListIds.has(page.id))
      
      if (unrecordedPages.length === 0) {
        setError('🎉 Amazing! You have recorded all available pages. Thank you for your incredible contribution to the project!')
        setCurrentNameList(null)
        return
      }
      
      // Check if user has a previously downloaded page that hasn't been recorded yet
      const latestDownload = latestDownloadData.downloadedPage
      if (latestDownload && !recordedNameListIds.has(latestDownload.id)) {
        // Show the previously downloaded page
        setCurrentNameList(latestDownload)
        setIsReturningToDownloadedPage(true)
        console.log('Showing previously downloaded page:', latestDownload.displayTitle)
      } else {
        // Select a random unrecorded page
        const randomPage = unrecordedPages[Math.floor(Math.random() * unrecordedPages.length)]
        setCurrentNameList(randomPage)
        setIsReturningToDownloadedPage(false)
      }
      
      setUnrecordedCount(unrecordedPages.length)
      
      // Show progress
      const recordedCount = existingRecordings.length
      const totalCount = nameLists.length
      setError('')
      console.log(`Progress: ${recordedCount}/${totalCount} pages recorded, ${unrecordedPages.length} remaining`)
    } catch (err) {
      setError('Failed to load name lists. Please try again.')
      console.error('Error loading name lists:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Download PDF for a name list
  const downloadPDF = async (nameListId: string, title: string) => {
    try {
      const response = await fetch(apiUrl(`/api/namelists/${nameListId}/pdf`))
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setSuccessMessage(`PDF downloaded: ${title}`)
      setShowSuccessMessage(true)
    } catch (err) {
      setError('Failed to download PDF. Please try again.')
      console.error('Error downloading PDF:', err)
    }
  }

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[], nameListId: string, nameListTitle: string) => {
    const validFiles = acceptedFiles.filter(file => {
      const isAudio = file.type.startsWith('audio/')
      if (!isAudio) {
        setError(`${file.name} is not an audio file`)
        return false
      }
      return true
    })

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      nameListId,
      nameListTitle,
      status: 'pending'
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [])

  // Handle file input change
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, nameListId: string, nameListTitle: string) => {
    const files = Array.from(event.target.files || [])
    onDrop(files, nameListId, nameListTitle)
    // Reset input
    event.target.value = ''
  }

  // Remove file from upload list
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload a single file
  const uploadFile = async (fileData: UploadedFile, index: number) => {
    try {
      // Update status to uploading
      setUploadedFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading' } : f
      ))

      const formData = new FormData()
      formData.append('audio', fileData.file)
      formData.append('nameListId', fileData.nameListId)
      formData.append('method', 'UPLOAD')

      console.log('Uploading file:', {
        name: fileData.file.name,
        size: fileData.file.size,
        type: fileData.file.type,
        nameListId: fileData.nameListId
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch(apiUrl('/api/recordings/upload'), {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Upload response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload error response:', errorText)
        throw new Error(`Upload failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('Upload success:', result)

      // Update status to success
      setUploadedFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'success' } : f
      ))

    } catch (err) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      
      // Update status to error
      setUploadedFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: errorMessage } : f
      ))
    }
  }

  // Upload all pending files
  const uploadAllFiles = async () => {
    const pendingFiles = uploadedFiles
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.status === 'pending')

    for (const { file, index } of pendingFiles) {
      await uploadFile(file, index)
    }

    const successCount = uploadedFiles.filter(f => f.status === 'success').length
    if (successCount > 0) {
      setSuccessMessage(`Successfully uploaded ${successCount} recording(s)!`)
      setShowSuccessMessage(true)
    }
  }

  // Load name lists on mount
  React.useEffect(() => {
    if (status === 'authenticated') {
      loadNameLists()
    }
  }, [status])

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please sign in to access the offline contribution interface.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        </Box>
      </Container>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <LinearProgress variant="indeterminate" sx={{ width: 100 }} />
      case 'success': return <CheckCircle color="success" />
      case 'error': return <ErrorIcon color="error" />
      default: return <AudioFile />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success'
      case 'error': return 'error'
      case 'uploading': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Offline Contribution
      </Typography>
      
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Download name lists, record at your own pace, then upload your audio files
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Instructions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Offline Recording Process:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              We&lsquot;ll show you one unrecorded page at a time
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              Download the PDF for this page and record yourself reading the names
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              Upload your recording file back here when complete
            </Typography>
            <Typography component="li">
              Your contribution will be reviewed and added to the exhibition
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Current Page */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Your Page to Record
        </Typography>
        {unrecordedCount > 0 && (
          <Chip
            label={`${unrecordedCount} pages remaining`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Loading name lists...</Typography>
        </Box>
      ) : (
        <>
          {isReturningToDownloadedPage && (
            <Alert severity="info" sx={{ mb: 3 }}>
              📎 <strong>Welcome back!</strong> We&lsquot;re showing you the page you previously downloaded so you can upload your recording.
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mb: 4 }}>
          {currentNameList && (
            <Grid item xs={12} key={currentNameList.id}>
              <Card sx={{ border: 2, borderColor: isReturningToDownloadedPage ? 'info.main' : 'primary.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {currentNameList.title}
                      </Typography>
                      <Chip 
                        label={`${currentNameList.names.length} names`} 
                        size="small" 
                        color="primary" 
                        sx={{ mr: 1 }}
                      />
                      {currentNameList.pageNumber && (
                        <Chip 
                          label={`Page ${currentNameList.pageNumber}`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {isReturningToDownloadedPage ? (
                        <Chip
                          label="Previously Downloaded"
                          size="small"
                          color="info"
                          variant="filled"
                        />
                      ) : (
                        <Chip
                          label="Unrecorded"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => downloadPDF(currentNameList.id, currentNameList.title)}
                      size="small"
                    >
                      Download PDF
                    </Button>
                    {session?.user?.role === 'ADMIN' && (
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => {
                          setIsReturningToDownloadedPage(false)
                          loadNameLists()
                        }}
                        size="small"
                        disabled={isLoading}
                      >
                        Get Another Page
                      </Button>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* File Upload Area */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Upload Recording:
                    </Typography>
                    <Paper
                      sx={{
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover'
                        }
                      }}
                      onClick={() => document.getElementById(`file-input-${currentNameList.id}`)?.click()}
                    >
                      <Upload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Click to select audio file or drag and drop
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Supports MP3, WAV, M4A, and other audio formats
                      </Typography>
                      <input
                        id={`file-input-${currentNameList.id}`}
                        type="file"
                        accept="audio/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e, currentNameList.id, currentNameList.title)}
                      />
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          </Grid>
        </>
      )}

      {/* Upload Queue */}
      {uploadedFiles.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upload Queue ({uploadedFiles.length} files)
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={uploadAllFiles}
                disabled={uploadedFiles.every(f => f.status !== 'pending')}
              >
                Upload All
              </Button>
            </Box>

            {uploadedFiles.map((fileData, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ mr: 2 }}>
                    {getStatusIcon(fileData.status)}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {fileData.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fileData.nameListTitle} • {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={fileData.status}
                    size="small"
                    color={getStatusColor(fileData.status)}
                  />
                  {fileData.status === 'pending' && (
                    <IconButton
                      size="small"
                      onClick={() => removeFile(index)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}