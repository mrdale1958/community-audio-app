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
  LinearProgress,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  TrendingUp,
  People,
  VolumeUp,
  Schedule,
  PlayArrow,
  Mic,
  Upload,
  CheckCircle,
  PendingActions,
  Celebration,
  Timeline,
  Storage,
  Group
} from '@mui/icons-material'
import Link from 'next/link'

interface PublicStats {
  totalRecordings: number
  approvedRecordings: number
  pendingRecordings: number
  totalContributors: number
  totalNameLists: number
  totalDuration: number
  recentActivity: Array<{
    id: string
    type: 'recording' | 'approval'
    contributorName: string
    nameListTitle: string
    createdAt: string
  }>
  topContributors: Array<{
    name: string
    recordingCount: number
  }>
  methodBreakdown: {
    live: number
    upload: number
  }
}

export default function ObservePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const TARGET_RECORDINGS = 5000

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/public/stats')
      if (!response.ok) throw new Error('Failed to load statistics')
      
      const data = await response.json()
      setStats(data)
      setError('')
    } catch (err) {
      setError('Failed to load project statistics')
      console.error('Error loading stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getProgressPercentage = () => {
    if (!stats) return 0
    return Math.min((stats.approvedRecordings / TARGET_RECORDINGS) * 100, 100)
  }

  const getProgressColor = () => {
    const percentage = getProgressPercentage()
    if (percentage >= 80) return 'success'
    if (percentage >= 50) return 'primary'
    if (percentage >= 25) return 'warning'
    return 'error'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Loading project statistics...</Typography>
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={loadStats}>
            Try Again
          </Button>
        </Box>
      </Container>
    )
  }

  if (!stats) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          No statistics available at this time.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Project Progress
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Watch our community come together to preserve and honor these names
        </Typography>
      </Box>

      {/* Main Progress Card */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                {stats.approvedRecordings.toLocaleString()} of {TARGET_RECORDINGS.toLocaleString()}
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                Community recordings collected
              </Typography>
              
              <LinearProgress
                variant="determinate"
                value={getProgressPercentage()}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white',
                    borderRadius: 6
                  }
                }}
              />
              
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
                {getProgressPercentage().toFixed(1)}% complete
                {stats.pendingRecordings > 0 && (
                  <> • {stats.pendingRecordings} recordings awaiting review</>
                )}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={getProgressPercentage()}
                  size={120}
                  thickness={8}
                  sx={{
                    color: 'white',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round'
                    }
                  }}
                />
                <Box sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <Typography variant="h6" component="div" color="white">
                    {Math.round(getProgressPercentage())}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <Group />
              </Avatar>
              <Typography variant="h4" color="primary.main">
                {stats.totalContributors}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Community Contributors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <Schedule />
              </Avatar>
              <Typography variant="h4" color="success.main">
                {formatDuration(stats.totalDuration)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Audio Collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <VolumeUp />
              </Avatar>
              <Typography variant="h4" color="info.main">
                {stats.totalNameLists}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Name Lists Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4" color="warning.main">
                {stats.totalRecordings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Submissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline sx={{ mr: 1 }} />
                <Typography variant="h6">Recent Activity</Typography>
              </Box>
              
              {stats.recentActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No recent activity to display
                </Typography>
              ) : (
                <List dense>
                  {stats.recentActivity.slice(0, 8).map((activity, index) => (
                    <React.Fragment key={`${activity.id}-${activity.type}-${index}`}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: activity.type === 'recording' ? 'primary.main' : 'success.main' }}>
                            {activity.type === 'recording' ? <Mic fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              <strong>{activity.contributorName}</strong>{' '}
                              {activity.type === 'recording' ? 'submitted a recording for' : 'had their recording approved for'}{' '}
                              <em>{activity.nameListTitle}</em>
                            </Typography>
                          }
                          secondary={formatTimeAgo(activity.createdAt)}
                        />
                      </ListItem>
                      {index < stats.recentActivity.length - 1 && index < 7 && <Divider key={`divider-${index}`} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Community Insights */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Top Contributors */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Celebration sx={{ mr: 1 }} />
                    <Typography variant="h6">Top Contributors</Typography>
                  </Box>
                  
                  {stats.topContributors.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No contributors yet
                    </Typography>
                  ) : (
                    <List dense>
                      {stats.topContributors.slice(0, 5).map((contributor, index) => (
                        <ListItem key={`contributor-${contributor.name}-${index}`} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={contributor.name}
                            secondary={`${contributor.recordingCount} recording${contributor.recordingCount !== 1 ? 's' : ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recording Methods */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recording Methods
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Mic sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">Live Recording</Typography>
                      </Box>
                      <Typography variant="body2">{stats.methodBreakdown.live}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.methodBreakdown.live / Math.max(stats.totalRecordings, 1)) * 100}
                      color="primary"
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Upload sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">File Upload</Typography>
                      </Box>
                      <Typography variant="body2">{stats.methodBreakdown.upload}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.methodBreakdown.upload / Math.max(stats.totalRecordings, 1)) * 100}
                      color="secondary"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Call to Action */}
      <Card sx={{ mt: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <CardContent sx={{ py: 4 }}>
          {session?.user?.role === 'OBSERVER' ? (
            <>
              <Typography variant="h5" gutterBottom>
                Become a Contributor
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                Upgrade your account to start recording and contribute to the community audio collection.
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/dashboard/upgrade')}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main', 
                  '&:hover': { bgcolor: 'grey.100' },
                  minWidth: 200
                }}
              >
                Become a Contributor
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h5" gutterBottom>
                Join Our Community
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                Help us reach our goal of {TARGET_RECORDINGS.toLocaleString()} recordings. Every voice matters in preserving these important names.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {!session ? (
                  <>
                    <Button
                      component={Link}
                      href="/auth/signup"
                      variant="contained"
                      size="large"
                      sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                    >
                      Join the Project
                    </Button>
                    <Button
                      component={Link}
                      href="/playback"
                      variant="outlined"
                      size="large"
                      startIcon={<PlayArrow />}
                      sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.300' } }}
                    >
                      Listen to Recordings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      component={Link}
                      href="/contribute/live"
                      variant="contained"
                      size="large"
                      startIcon={<Mic />}
                      sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                    >
                      Start Recording
                    </Button>
                    <Button
                      component={Link}
                      href="/contribute/offline"
                      variant="outlined"
                      size="large"
                      startIcon={<Upload />}
                      sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.300' } }}
                    >
                      Upload Recording
                    </Button>
                    <Button
                      component={Link}
                      href="/playback"
                      variant="outlined"
                      size="large"
                      startIcon={<PlayArrow />}
                      sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.300' } }}
                    >
                      Listen
                    </Button>
                  </>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}