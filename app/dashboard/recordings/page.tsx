'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  Download,
  Delete,
  Info,
  VolumeUp,
  FilterList,
  Refresh,
  Upload,
  Mic
} from '@mui/icons-material'

interface Recording {
  id: string
  filename: string
  originalName: string
  fileSize: number
  duration: number | null
  mimeType: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  method: 'LIVE' | 'UPLOAD'
  createdAt: string
  nameList: {
    id: string
    title: string
  }
}

export default function DashboardRecordingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [recordingsPerPage] = useState(10)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [methodFilter, setMethodFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Audio player state
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load user's recordings
  const loadRecordings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recordings')
      if (!response.ok) throw new Error('Failed to load recordings')
      
      const data = await response.json()
      
      // Handle different response formats
      let recordingsArray = []
      if (Array.isArray(data)) {
        recordingsArray = data
      } else if (data && Array.isArray(data.recordings)) {
        recordingsArray = data.recordings
      } else {
        console.error('API returned unexpected data format:', data)
        setError('Invalid data format received from server')
        setRecordings([])
        return
      }
      
      setRecordings(recordingsArray)
      setError('')
    } catch (err) {
      setError('Failed to load recordings. Please try again.')
      setRecordings([]) // Ensure recordings is always an array
      console.error('Error loading recordings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    if (!Array.isArray(recordings)) {
      setFilteredRecordings([])
      return
    }

    let filtered = recordings

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Method filter
    if (methodFilter !== 'ALL') {
      filtered = filtered.filter(r => r.method === methodFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.originalName.toLowerCase().includes(query) ||
        r.nameList.title.toLowerCase().includes(query)
      )
    }

    setFilteredRecordings(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [recordings, statusFilter, methodFilter, searchQuery])

  // Play/pause audio
  const toggleAudio = async (recording: Recording) => {
    try {
      if (playingId === recording.id) {
        // Pause current recording
        audioElement?.pause()
        setPlayingId(null)
        return
      }

      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }

      // Play new recording
      const audio = new Audio(`/api/recordings/${recording.id}/audio`)
      audio.addEventListener('ended', () => setPlayingId(null))
      audio.addEventListener('error', () => {
        setError('Failed to play audio')
        setPlayingId(null)
      })

      await audio.play()
      setAudioElement(audio)
      setPlayingId(recording.id)

    } catch (err) {
      setError('Failed to play audio')
      console.error('Audio playback error:', err)
    }
  }

  // Download recording
  const downloadRecording = async (recording: Recording) => {
    try {
      const response = await fetch(`/api/recordings/${recording.id}/download`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = recording.originalName || recording.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setSuccessMessage('Recording downloaded successfully')
      setShowSuccessMessage(true)
    } catch (err) {
      setError('Failed to download recording')
      console.error('Download error:', err)
    }
  }

  // Delete recording
  const deleteRecording = async () => {
    if (!recordingToDelete) return
    
    try {
      const response = await fetch(`/api/recordings/${recordingToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Delete failed')
      
      setRecordings(prev => prev.filter(r => r.id !== recordingToDelete.id))
      setShowDeleteDialog(false)
      setRecordingToDelete(null)
      
      setSuccessMessage('Recording deleted successfully')
      setShowSuccessMessage(true)
    } catch (err) {
      setError('Failed to delete recording')
      console.error('Delete error:', err)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'error'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  // Get method icon
  const getMethodIcon = (method: string) => {
    return method === 'LIVE' ? <Mic fontSize="small" /> : <Upload fontSize="small" />
  }

  // Pagination
  const startIndex = (currentPage - 1) * recordingsPerPage
  const endIndex = startIndex + recordingsPerPage
  const paginatedRecordings = filteredRecordings.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredRecordings.length / recordingsPerPage)

  // Load recordings on mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadRecordings()
    }
  }, [status])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
    }
  }, [audioElement])

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please sign in to view your recordings.
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Recordings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadRecordings}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main">
                {Array.isArray(recordings) ? recordings.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Recordings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {Array.isArray(recordings) ? recordings.filter(r => r.status === 'APPROVED').length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">
                {Array.isArray(recordings) ? recordings.filter(r => r.status === 'PENDING').length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">
                {Array.isArray(recordings) ? formatFileSize(recordings.reduce((acc, r) => acc + r.fileSize, 0)) : '0 Bytes'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Size
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Method</InputLabel>
                <Select
                  value={methodFilter}
                  label="Method"
                  onChange={(e) => setMethodFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Methods</MenuItem>
                  <MenuItem value="LIVE">Live Recording</MenuItem>
                  <MenuItem value="UPLOAD">File Upload</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Search recordings or name lists"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recordings Table */}
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading recordings...</Typography>
        </Box>
      ) : paginatedRecordings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <VolumeUp sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No recordings found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {!Array.isArray(recordings) || recordings.length === 0 
                ? "You haven't made any recordings yet."
                : "No recordings match your current filters."
              }
            </Typography>
            <Button variant="contained" href="/contribute/live">
              Start Recording
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Recording</TableCell>
                  <TableCell>Name List</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRecordings.map((recording) => (
                  <TableRow key={recording.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {recording.originalName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recording.filename}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {recording.nameList.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={recording.status}
                        size="small"
                        color={getStatusColor(recording.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getMethodIcon(recording.method)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {recording.method === 'LIVE' ? 'Live' : 'Upload'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(recording.duration)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(recording.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(recording.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleAudio(recording)}
                          color={playingId === recording.id ? 'secondary' : 'default'}
                        >
                          {playingId === recording.id ? <Pause /> : <PlayArrow />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => downloadRecording(recording)}
                        >
                          <Download />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRecording(recording)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Info />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setRecordingToDelete(recording)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Recording</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{recordingToDelete?.originalName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={deleteRecording} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recording Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Recording Details</DialogTitle>
        <DialogContent>
          {selectedRecording && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRecording.originalName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name List:
                  </Typography>
                  <Typography variant="body2">
                    {selectedRecording.nameList.title}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={selectedRecording.status}
                    size="small"
                    color={getStatusColor(selectedRecording.status) as any}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Method:
                  </Typography>
                  <Typography variant="body2">
                    {selectedRecording.method === 'LIVE' ? 'Live Recording' : 'File Upload'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration:
                  </Typography>
                  <Typography variant="body2">
                    {formatDuration(selectedRecording.duration)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    File Size:
                  </Typography>
                  <Typography variant="body2">
                    {formatFileSize(selectedRecording.fileSize)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Format:
                  </Typography>
                  <Typography variant="body2">
                    {selectedRecording.mimeType}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Upload Date:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedRecording.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Filename:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {selectedRecording.filename}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
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
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}