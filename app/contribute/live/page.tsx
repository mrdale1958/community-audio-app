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
  Snackbar,
  Slider,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Mic,
  Stop,
  PlayArrow,
  Pause,
  Save,
  VolumeUp,
  Download,
  Refresh,
  ExpandMore,
  Tune
} from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'

interface NameList {
  id: string
  originalId: string
  title: string
  names: Array<{name: string, panelNumber?: string, blockNumber?: string, originalRecord?: string} | string>
  pageNumber: number
  subPage: string
  displayTitle: string
  totalNamesInOriginal: number
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
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Audio playback ref
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Styling controls state with localStorage persistence
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recordingDisplayOptions')
      return saved ? JSON.parse(saved).columnCount || 3 : 3
    }
    return 3
  })
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recordingDisplayOptions')
      return saved ? JSON.parse(saved).fontSize || 16 : 16
    }
    return 16
  })
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recordingDisplayOptions')
      return saved ? JSON.parse(saved).fontWeight || 'normal' : 'normal'
    }
    return 'normal'
  })
  const [showBorder, setShowBorder] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recordingDisplayOptions')
      return saved ? JSON.parse(saved).showBorder !== false : true
    }
    return true
  })
  const [verticalSpacing, setVerticalSpacing] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recordingDisplayOptions')
      return saved ? JSON.parse(saved).verticalSpacing || 1.5 : 1.5
    }
    return 1.5
  })
  const [horizontalSpacing, setHorizontalSpacing] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recordingDisplayOptions')
      return saved ? JSON.parse(saved).horizontalSpacing || 1.5 : 1.5
    }
    return 1.5
  })
  
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
      const response = await fetch(apiUrl('/api/namelists'))
      if (!response.ok) throw new Error('Failed to load name lists')
      
      const data = await response.json()
      const nameLists = data.pages || []
      
      if (nameLists.length === 0) {
        setError('No name lists available. Please contact an administrator.')
        return
      }
      
      console.log('Page split stats:', data.stats)
      
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
       console.log("saving", apiUrl('/api/recordings/upload'), audioBlob, audioBlob.size); // Should be > 0
       // 
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`)
      formData.append('nameListId', currentNameList.id)
      formData.append('method', 'LIVE')
      formData.append('duration', recordingTime.toString())
      
      const response = await fetch(apiUrl('/api/recordings/upload'), {
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

  // Toggle audio playback
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Save display options to localStorage
  const saveDisplayOptions = () => {
    if (typeof window !== 'undefined') {
      const options = {
        columnCount,
        fontSize,
        fontWeight,
        showBorder,
        verticalSpacing,
        horizontalSpacing
      }
      localStorage.setItem('recordingDisplayOptions', JSON.stringify(options))
    }
  }

  // Save options whenever they change
  useEffect(() => {
    saveDisplayOptions()
  }, [columnCount, fontSize, fontWeight, showBorder, verticalSpacing, horizontalSpacing])

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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Name List Display */}
      {currentNameList && (
        <>
          {/* Page Title - Right under header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Live Recording - {currentNameList.displayTitle}
            </Typography>
          </Box>

          {/* Compact Styling Controls */}
          <Card sx={{ mb: 2 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tune fontSize="small" />
                  <Typography variant="body2">Display Options</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <FormControl size="small" fullWidth>
                      <FormLabel>Columns</FormLabel>
                      <Select
                        value={columnCount}
                        onChange={(e) => setColumnCount(Number(e.target.value))}
                        size="small"
                      >
                        <MenuItem value={2}>2 columns</MenuItem>
                        <MenuItem value={3}>3 columns</MenuItem>
                        <MenuItem value={4}>4 columns</MenuItem>
                        <MenuItem value={5}>5 columns</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControl size="small" fullWidth>
                      <FormLabel>Font Size</FormLabel>
                      <Slider
                        value={fontSize}
                        onChange={(_, value) => setFontSize(value as number)}
                        min={12}
                        max={24}
                        step={1}
                        marks={[{value: 16, label: '16px'}]}
                        size="small"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={fontWeight === 'bold'}
                            onChange={(e) => setFontWeight(e.target.checked ? 'bold' : 'normal')}
                            size="small"
                          />
                        }
                        label="Bold"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showBorder}
                            onChange={(e) => setShowBorder(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Borders"
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Recording Controls */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ pb: '16px !important' }}>

              {/* Compact Recording Controls */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, minWidth: { xs: '100%', sm: 'auto' }, textAlign: 'center', mb: { xs: 1, sm: 0 } }}>
                  Read clearly:
                </Typography>
                
                {!isRecording && !audioBlob && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Mic />}
                    onClick={startRecording}
                    disabled={!currentNameList || isLoading}
                    color="error"
                  >
                    Record
                  </Button>
                )}

                {isRecording && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={togglePause}
                      color={isPaused ? "primary" : "default"}
                    >
                      {isPaused ? <PlayArrow /> : <Pause />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={stopRecording}
                      color="error"
                    >
                      <Stop />
                    </IconButton>
                    <Typography variant="body2" color={isPaused ? "text.secondary" : "error"}>
                      {formatTime(recordingTime)} {isPaused && "(Paused)"}
                    </Typography>
                  </Box>
                )}

                {audioBlob && !isRecording && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={togglePlayback}
                      disabled={!audioUrl}
                    >
                      {isPlaying ? 'Stop' : 'Play'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Save />}
                      onClick={() => setShowSaveDialog(true)}
                      variant="contained"
                      color="primary"
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Refresh />}
                      onClick={resetRecording}
                    >
                      Clear
                    </Button>
                  </Box>
                )}

                {!isRecording && !audioBlob && session?.user?.role === 'ADMIN' && (
                  <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={loadNameList}
                    disabled={isLoading}
                    sx={{ ml: 1 }}
                  >
                    New Page
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Names Display */}
          <Card>
            <CardContent>
            
            <Paper sx={{ p: verticalSpacing, bgcolor: 'grey.50', border: showBorder ? 1 : 0, borderColor: 'divider' }}>
              <Grid container spacing={horizontalSpacing}>
                {currentNameList.names.map((nameObj, index) => (
                  <Grid 
                    item 
                    xs={12 / Math.min(columnCount, 2)} 
                    md={12 / columnCount} 
                    key={index}
                  >
                    <Typography
                      variant="body1"
                      sx={{ 
                        p: verticalSpacing,
                        bgcolor: 'background.paper',
                        border: showBorder ? 1 : 0,
                        borderColor: 'divider',
                        borderRadius: 1,
                        textAlign: 'center',
                        minHeight: fontSize * 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        wordBreak: 'break-word',
                        hyphens: 'auto',
                        fontSize: fontSize,
                        fontWeight: fontWeight,
                        lineHeight: 1.3
                      }}
                    >
                      {typeof nameObj === "string" ? nameObj : nameObj.name}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
            

          </CardContent>
        </Card>
        </>
      )}

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
                    ref={audioRef}
                    controls 
                    src={audioUrl} 
                    style={{ width: '100%' }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
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
            Save this recording of "{currentNameList?.displayTitle}"?
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