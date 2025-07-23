'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Paper,
  Slider,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  Avatar,
  Divider,
  Tooltip
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeDown,
  Shuffle,
  Repeat,
  FilterList,
  Person,
  Schedule,
  Mic,
  Upload,
  QueueMusic,
  Stop
} from '@mui/icons-material'

interface Recording {
  id: string
  filename: string
  originalName: string
  fileSize: number
  duration: number | null
  method: 'LIVE' | 'UPLOAD'
  createdAt: string
  user: {
    id: string
    name: string
  }
  nameList: {
    id: string
    title: string
  }
}

export default function PlaybackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [recordingsPerPage] = useState(12)
  
  // Filters
  const [nameListFilter, setNameListFilter] = useState<string>('ALL')
  const [methodFilter, setMethodFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('newest')
  
  // Audio player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  
  // Queue management
  const [queue, setQueue] = useState<number[]>([])
  const [originalQueue, setOriginalQueue] = useState<number[]>([])
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  // Get unique name lists for filter
  const nameListOptions = recordings.reduce((acc, recording) => {
    if (!acc.find(nl => nl.id === recording.nameList.id)) {
      acc.push(recording.nameList)
    }
    return acc
  }, [] as Array<{id: string, title: string}>)

  // Load approved recordings
  const loadRecordings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recordings/public')
      if (!response.ok) throw new Error('Failed to load recordings')
      
      const data = await response.json()
      
      let recordingsArray = []
      if (Array.isArray(data)) {
        recordingsArray = data
      } else if (data && Array.isArray(data.recordings)) {
        recordingsArray = data.recordings
      }
      
      setRecordings(recordingsArray)
      
      // Initialize queue with all recordings
      const initialQueue = recordingsArray.map((_: Recording, index: number) => index)
      setQueue(initialQueue)
      setOriginalQueue(initialQueue)
      
      setError('')
    } catch (err) {
      setError('Failed to load recordings. Please try again.')
      console.error('Error loading recordings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters and sorting
  useEffect(() => {
    if (!Array.isArray(recordings)) {
      setFilteredRecordings([])
      return
    }

    let filtered = [...recordings]

    // Name list filter
    if (nameListFilter !== 'ALL') {
      filtered = filtered.filter(r => r.nameList.id === nameListFilter)
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
        r.nameList.title.toLowerCase().includes(query) ||
        r.user.name.toLowerCase().includes(query)
      )
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'nameList':
        filtered.sort((a, b) => a.nameList.title.localeCompare(b.nameList.title))
        break
      case 'contributor':
        filtered.sort((a, b) => a.user.name.localeCompare(b.user.name))
        break
    }

    setFilteredRecordings(filtered)
    setCurrentPage(1)
  }, [recordings, nameListFilter, methodFilter, searchQuery, sortBy])

  // Audio player functions
  const loadTrack = async (index: number) => {
    if (!filteredRecordings[index]) return

    const recording = filteredRecordings[index]
    setIsLoadingAudio(true)
    
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const audio = new Audio(`/api/recordings/${recording.id}/audio`)
      audioRef.current = audio

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
        setIsLoadingAudio(false)
      })

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })

      audio.addEventListener('ended', () => {
        handleNext()
      })

      audio.addEventListener('error', () => {
        setError('Failed to load audio')
        setIsLoadingAudio(false)
        setIsPlaying(false)
      })

      audio.volume = volume
      setCurrentTrackIndex(index)

    } catch (err) {
      setError('Failed to load audio')
      setIsLoadingAudio(false)
      console.error('Audio load error:', err)
    }
  }

  const handlePlay = async () => {
    if (currentTrackIndex === null && filteredRecordings.length > 0) {
      await loadTrack(0)
    }

    if (audioRef.current) {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (err) {
        setError('Failed to play audio')
        console.error('Play error:', err)
      }
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleNext = () => {
    if (currentTrackIndex === null || filteredRecordings.length === 0) return

    let nextIndex = currentTrackIndex + 1

    if (shuffle && queue.length > 0) {
      const currentQueuePosition = queue.indexOf(currentTrackIndex)
      if (currentQueuePosition < queue.length - 1) {
        nextIndex = queue[currentQueuePosition + 1]
      } else if (repeat) {
        nextIndex = queue[0]
      } else {
        setIsPlaying(false)
        return
      }
    } else {
      if (nextIndex >= filteredRecordings.length) {
        if (repeat) {
          nextIndex = 0
        } else {
          setIsPlaying(false)
          return
        }
      }
    }

    loadTrack(nextIndex)
  }

  const handlePrevious = () => {
    if (currentTrackIndex === null || filteredRecordings.length === 0) return

    let prevIndex = currentTrackIndex - 1

    if (shuffle && queue.length > 0) {
      const currentQueuePosition = queue.indexOf(currentTrackIndex)
      if (currentQueuePosition > 0) {
        prevIndex = queue[currentQueuePosition - 1]
      } else if (repeat) {
        prevIndex = queue[queue.length - 1]
      } else {
        return
      }
    } else {
      if (prevIndex < 0) {
        if (repeat) {
          prevIndex = filteredRecordings.length - 1
        } else {
          return
        }
      }
    }

    loadTrack(prevIndex)
  }

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value
      setCurrentTime(value)
    }
  }

  const handleVolumeChange = (value: number) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value
    }
  }

  const toggleShuffle = () => {
    const newShuffle = !shuffle
    setShuffle(newShuffle)
    
    if (newShuffle) {
      // Create shuffled queue
      const shuffled = [...originalQueue].sort(() => Math.random() - 0.5)
      setQueue(shuffled)
    } else {
      // Restore original order
      setQueue(originalQueue)
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playSpecificTrack = (index: number) => {
    loadTrack(index)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }, 100)
  }

  // Pagination
  const startIndex = (currentPage - 1) * recordingsPerPage
  const endIndex = startIndex + recordingsPerPage
  const paginatedRecordings = filteredRecordings.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredRecordings.length / recordingsPerPage)

  // Load recordings on mount
  useEffect(() => {
    loadRecordings()
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current)
      }
    }
  }, [])

  const currentRecording = currentTrackIndex !== null ? filteredRecordings[currentTrackIndex] : null

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Community Recordings
      </Typography>
      
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Listen to recordings from community members reading memorial names
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Audio Player */}
      {currentRecording && (
        <Card sx={{ mb: 4, position: 'sticky', top: 16, zIndex: 10 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {currentRecording.nameList.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      by {currentRecording.user.name}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <IconButton onClick={handlePrevious} disabled={isLoadingAudio}>
                    <SkipPrevious />
                  </IconButton>
                  
                  <IconButton
                    onClick={isPlaying ? handlePause : handlePlay}
                    disabled={isLoadingAudio}
                    size="large"
                    sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    {isLoadingAudio ? (
                      <LinearProgress sx={{ width: 24, height: 24 }} />
                    ) : isPlaying ? (
                      <Pause />
                    ) : (
                      <PlayArrow />
                    )}
                  </IconButton>
                  
                  <IconButton onClick={handleNext} disabled={isLoadingAudio}>
                    <SkipNext />
                  </IconButton>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  
                  <Tooltip title={shuffle ? 'Shuffle On' : 'Shuffle Off'}>
                    <IconButton onClick={toggleShuffle} color={shuffle ? 'primary' : 'default'}>
                      <Shuffle />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={repeat ? 'Repeat On' : 'Repeat Off'}>
                    <IconButton onClick={() => setRepeat(!repeat)} color={repeat ? 'primary' : 'default'}>
                      <Repeat />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" sx={{ minWidth: 40 }}>
                    {formatTime(currentTime)}
                  </Typography>
                  
                  <Slider
                    value={currentTime}
                    max={duration}
                    onChange={(_, value) => handleSeek(value as number)}
                    sx={{ flex: 1 }}
                    disabled={isLoadingAudio}
                  />
                  
                  <Typography variant="caption" sx={{ minWidth: 40 }}>
                    {formatTime(duration)}
                  </Typography>
                  
                  <VolumeDown />
                  <Slider
                    value={volume}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => handleVolumeChange(value as number)}
                    sx={{ width: 100 }}
                  />
                  <VolumeUp />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Browse & Filter</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Name List</InputLabel>
                <Select
                  value={nameListFilter}
                  label="Name List"
                  onChange={(e) => setNameListFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Lists</MenuItem>
                  {nameListOptions.map((nameList) => (
                    <MenuItem key={nameList.id} value={nameList.id}>
                      {nameList.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="nameList">Name List</MenuItem>
                  <MenuItem value="contributor">Contributor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={5}>
              <TextField
                fullWidth
                size="small"
                label="Search recordings, lists, or contributors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recording Stats */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredRecordings.length} recording{filteredRecordings.length !== 1 ? 's' : ''} 
          {recordings.length !== filteredRecordings.length && ` of ${recordings.length} total`}
        </Typography>
      </Box>

      {/* Recordings Grid */}
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Loading recordings...</Typography>
        </Box>
      ) : paginatedRecordings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <QueueMusic sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No recordings found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {recordings.length === 0 
                ? "No approved recordings are available yet."
                : "No recordings match your current filters."
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedRecordings.map((recording, index) => {
              const actualIndex = startIndex + index
              const isCurrentTrack = currentTrackIndex === actualIndex
              
              return (
                <Grid item xs={12} sm={6} md={4} key={recording.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      border: isCurrentTrack ? 2 : 0,
                      borderColor: 'primary.main',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => playSpecificTrack(actualIndex)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" noWrap title={recording.nameList.title}>
                            {recording.nameList.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            by {recording.user.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color={isCurrentTrack && isPlaying ? 'secondary' : 'primary'}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isCurrentTrack) {
                              isPlaying ? handlePause() : handlePlay()
                            } else {
                              playSpecificTrack(actualIndex)
                            }
                          }}
                        >
                          {isCurrentTrack && isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={recording.method === 'LIVE' ? <Mic /> : <Upload />}
                          label={recording.method === 'LIVE' ? 'Live' : 'Upload'}
                          size="small"
                          variant="outlined"
                        />
                        {recording.duration && (
                          <Chip
                            icon={<Schedule />}
                            label={formatTime(recording.duration)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        {new Date(recording.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  )
}