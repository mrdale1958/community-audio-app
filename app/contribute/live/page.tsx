'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip
} from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import StopIcon from '@mui/icons-material/Stop'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { CONFIG } from '@/lib/config'

type RecordingState = 'idle' | 'recording' | 'paused' | 'completed'

export default function LiveRecordingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [nameListId, setNameListId] = useState<string | null>(null)
  
  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Names data
  const [currentNames, setCurrentNames] = useState<string[]>([])

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, router])

  if (!session) {
    return <Container><Typography>Loading...</Typography></Container>
  }

  // Load name list
  useEffect(() => {
    const loadNameList = async () => {
      try {
        const response = await fetch('/api/namelists')
        if (response.ok) {
          const data = await response.json()
          if (data.nameLists && data.nameLists.length > 0) {
            const nameList = data.nameLists[0]
            setNameListId(nameList.id)
            setCurrentNames(JSON.parse(nameList.names))
          }
        }
      } catch (error) {
        console.error('Failed to load name list:', error)
        // Fallback to hardcoded names
        setCurrentNames([
          'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown'
        ])
      }
    }

    loadNameList()
  }, [])

  // Timer effect
  useEffect(() => {
    if (recordingState === 'recording') {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [recordingState])

  const startRecording = async () => {
    try {
      setError('')
      setSaved(false)
      
      // Request microphone access

// In startRecording function:
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: CONFIG.DEFAULT_RECORDING_QUALITY
})
      
      streamRef.current = stream
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      // Handle data available
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      })
      
      // Handle recording stop
      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setRecordingState('completed')
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      })
      
      // Start recording
      mediaRecorder.start(1000)
      setRecordingState('recording')
      setDuration(0)
      
    } catch (err) {
      setError('Could not access microphone. Please check permissions.')
      console.error('Error starting recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
    }
  }

  const stopAndSave = () => {
    stopRecording()
    // Save will happen automatically after stop completes
    setTimeout(() => {
      saveRecording()
    }, 500)
  }

  const saveRecording = async () => {
    if (!audioBlob || !session) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('duration', duration.toString())
      formData.append('title', `Live Recording - ${new Date().toLocaleDateString()}`)
      if (nameListId) {
        formData.append('nameListId', nameListId)
      }

      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSaved(true)
        console.log('Recording saved:', data.recordingId)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save recording')
      }
    } catch (error) {
      setError('Failed to save recording')
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Live Recording Session
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Read the names below clearly into your microphone
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Recording Controls */}
        <Card sx={{ mb: 4, bgcolor: 'background.default' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Box mb={2}>
              <Chip 
                label={recordingState.toUpperCase()} 
                color={recordingState === 'recording' ? 'error' : 'default'}
                sx={{ mb: 2 }}
              />
              <Typography variant="h5">
                {formatTime(duration)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {recordingState === 'idle' && (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<MicIcon />}
                  onClick={startRecording}
                >
                  Start Recording
                </Button>
              )}

              {recordingState === 'recording' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<PauseIcon />}
                    onClick={pauseRecording}
                  >
                    Pause
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={stopRecording}
                  >
                    Stop
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<StopIcon />}
                    onClick={stopAndSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Stop & Save'}
                  </Button>
                </>
              )}

              {recordingState === 'paused' && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={resumeRecording}
                  >
                    Resume
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<StopIcon />}
                    onClick={stopRecording}
                  >
                    Stop
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<StopIcon />}
                    onClick={stopAndSave}
                    disabled={saving}
                  >
                    Stop & Save
                  </Button>
                </>
              )}
            </Box>

            {recordingState === 'recording' && (
              <LinearProgress sx={{ mt: 2 }} color="error" />
            )}
          </CardContent>
        </Card>

        {/* Names to Read */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Names to Read:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {currentNames.map((name, index) => (
                <Typography 
                  key={index}
                  variant="h5"
                  sx={{ 
                    p: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  {name}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Recording Complete */}
        {recordingState === 'completed' && audioBlob && (
          <Card sx={{ mt: 4, bgcolor: saved ? 'success.light' : 'info.light' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Recording Complete! 🎉
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Duration: {formatTime(duration)} | Size: {Math.round(audioBlob.size / 1024)}KB
              </Typography>
              
              {/* Audio playback */}
              <audio 
                controls 
                src={URL.createObjectURL(audioBlob)}
                style={{ width: '100%', marginBottom: '16px' }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.reload()}
                  disabled={saving}
                >
                  Record Again
                </Button>
                {!saved && (
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={saveRecording}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Recording'}
                  </Button>
                )}
              </Box>

              {saved && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Recording saved successfully! You can now record another set of names.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </Paper>
    </Container>
  )
}