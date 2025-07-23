'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material'
import {
  Mic,
  Stop,
  PlayArrow,
  Pause,
  Save,
  VolumeUp,
  Download,
  Refresh
} from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface NameList {
  id: string
  title: string
  names: string[]
  pageNumber: number
}

export default function LiveRecordingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  
  // UI state
  const [currentNameList, setCurrentNameList] = useState<NameList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [audioPreviewWorks, setAudioPreviewWorks] = useState(true)
  
  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Get best supported MIME type for recording AND playback
  const getPreferredMimeType = () => {
    // Check for Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (isSafari) {
      // Safari prefers MP4 audio for both recording and playback
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        return 'audio/mp4'
      }
      if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')) {
        return 'audio/mp4;codecs=mp4a.40.2'
      }
    }
    
    // For other browsers, try WebM first (better compression)
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/ogg;codecs=opus'
    ]
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType
      }
    }
    
    return 'audio/webm' // fallback
  }

  // Load a random name list
  const loadNameList = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/namelists')
      if (!response.ok) throw new Error('Failed to load name lists')
      
      const nameLists = await response.json()
      if (nameLists.length === 0) {
        setError('No name lists available. Please contact an administrator.')
        return
      }
      
      // Select a random name list
      const randomList = nameLists[Math.floor(Math.random() * nameLists.length)]
      setCurrentNameList(randomList)
      setError('')
    } catch (err) {
      setError('Failed to load name list. Please try again.')
      console.error('Error loading name lists:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize microphone
  const initializeMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: getPreferredMimeType()
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const recordedMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
        let blob = new Blob(chunksRef.current, { type: recordedMimeType })
        
        // Check if the recorded format can be played back
        const audio = document.createElement('audio')
        const testUrl = URL.createObjectURL(blob)
        
        try {
          // Test if browser can play this format
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplay', resolve, { once: true })
            audio.addEventListener('error', reject, { once: true })
            audio.src = testUrl
            audio.load()
            
            // Timeout after 2 seconds
            setTimeout(() => reject(new Error('timeout')), 2000)
          })
          
          // Success - use original blob
          setAudioBlob(blob)
          setAudioUrl(testUrl)
          
        } catch (error) {
          // Playback failed - try to convert or provide alternative
          URL.revokeObjectURL(testUrl)
          console.log('Original format playback failed, using original blob for saving')
          
          // Still save the original blob (it's valid for upload)
          setAudioBlob(blob)
          
          // Create a data URL as fallback (for very small files)
          if (blob.size < 1024 * 1024) { // Less than 1MB
            const reader = new FileReader()
            reader.onload = () => {
              setAudioUrl(reader.result as string)
            }
            reader.readAsDataURL(blob)
          } else {
            // For larger files, just don't show preview
            setAudioUrl('')
          }
        }
      }
      
      return true
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and refresh the page.')
      console.error('Error accessing microphone:', err)
      return false
    }
  }

  // Start recording
  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      const initialized = await initializeMicrophone()
      if (!initialized) return
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      chunksRef.current = []
      mediaRecorderRef.current.start(1000) // Capture data every second
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
      setIsPaused(!isPaused)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Save recording
  const saveRecording = async () => {
    if (!audioBlob || !currentNameList) return
    
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`)
      formData.append('nameListId', currentNameList.id)
      formData.append('method', 'LIVE')
      formData.append('duration', recordingTime.toString())
      
      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to save recording')
      }
      
      const result = await response.json()
      setShowSaveDialog(false)
      
      // Reset for next recording
      resetRecording()
      
      // Show success message
      setShowSuccessMessage(true)
      
    } catch (err) {
      setError('Failed to save recording. Please try again.')
      console.error('Error saving recording:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Reset recording state
  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl('')
    setRecordingTime(0)
    chunksRef.current = []
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Load name list on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadNameList()
    }
  }, [status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

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
          Please sign in to access the recording interface.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Live Recording
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Name List Display */}
      {currentNameList && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {currentNameList.title}
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={loadNameList}
                disabled={isRecording || isLoading}
                size="small"
              >
                New List
              </Button>
            </Box>
            
            <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
              <Grid container spacing={1}>
                {currentNameList.names.map((name, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Chip 
                      label={name} 
                      variant="outlined" 
                      size="small"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Read these {currentNameList.names.length} names clearly into your microphone
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Recording Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h2" component="div" color={isRecording ? 'error.main' : 'text.secondary'}>
              {formatTime(recordingTime)}
            </Typography>
            {isRecording && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                    mr: 1,
                    animation: 'pulse 1.5s ease-in-out infinite alternate'
                  }}
                />
                <Typography variant="body2" color="error">
                  {isPaused ? 'PAUSED' : 'RECORDING'}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isRecording && !audioBlob && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Mic />}
                onClick={startRecording}
                disabled={!currentNameList || isLoading}
                color="error"
                sx={{ minWidth: 140 }}
              >
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                <IconButton
                  size="large"
                  onClick={togglePause}
                  color="warning"
                  sx={{ bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.main' } }}
                >
                  {isPaused ? <PlayArrow /> : <Pause />}
                </IconButton>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Stop />}
                  onClick={stopRecording}
                  color="error"
                  sx={{ minWidth: 140 }}
                >
                  Stop Recording
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Playback and Save */}
      {audioBlob && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recording Complete
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {audioUrl ? (
                <Box>
                  <audio 
                    controls 
                    src={audioUrl} 
                    style={{ width: '100%' }}
                    onError={(e) => {
                      console.error('Audio playback error:', e)
                      setError('Audio preview unavailable in this browser, but recording is valid for saving')
                    }}
                    onLoadedData={() => {
                      // Clear any previous errors when audio loads successfully
                      if (error.includes('preview unavailable')) {
                        setError('')
                      }
                    }}
                  />
                  {audioBlob && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Format: {audioBlob.type} • Size: {(audioBlob.size / 1024).toFixed(1)} KB • Duration: {formatTime(recordingTime)}
                    </Typography>
                  )}
                </Box>
              ) : audioBlob ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Recording completed successfully! Preview not available in this browser, but your audio is ready to save.
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Format: {audioBlob.type} • Size: {(audioBlob.size / 1024).toFixed(1)} KB • Duration: {formatTime(recordingTime)}
                  </Typography>
                </Box>
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => setShowSaveDialog(true)}
                color="success"
              >
                Save Recording
              </Button>

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = audioUrl
                  a.download = `recording-${Date.now()}.webm`
                  a.click()
                }}
              >
                Download
              </Button>

              <Button
                variant="outlined"
                onClick={resetRecording}
                color="error"
              >
                Discard
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveDialog} onClose={() => !isSaving && setShowSaveDialog(false)}>
        <DialogTitle>Save Recording</DialogTitle>
        <DialogContent>
          <Typography>
            Save this recording of "{currentNameList?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Duration: {formatTime(recordingTime)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={saveRecording} 
            variant="contained" 
            disabled={isSaving}
            startIcon={<Save />}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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
          Recording saved successfully! You can now make another recording.
        </Alert>
      </Snackbar>
    </Container>
  )
}