'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  Avatar,
  Divider,
  Paper
} from '@mui/material'
import {
  Mic,
  Upload,
  PlayArrow,
  Person,
  Analytics,
  History,
  TrendingUp
} from '@mui/icons-material'
import Link from 'next/link'

interface DashboardStats {
  totalRecordings: number
  approvedRecordings: number
  pendingRecordings: number
  totalDuration: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRecordings, setRecentRecordings] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirect if not authenticated or insufficient role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role === 'OBSERVER') {
      router.push('/observe')
    }
  }, [status, session?.user?.role, router])

  // Load user stats and recent recordings
  useEffect(() => {
    const loadDashboardData = async () => {
      if (status === 'authenticated' && (session?.user?.role === 'CONTRIBUTOR' || session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN')) {
        try {
          // Load user recordings stats
          const response = await fetch('/api/recordings')
          if (response.ok) {
            const data = await response.json()
            const recordings = Array.isArray(data) ? data : (data.recordings || [])
            
            const stats: DashboardStats = {
              totalRecordings: recordings.length,
              approvedRecordings: recordings.filter((r: any) => r.status === 'APPROVED').length,
              pendingRecordings: recordings.filter((r: any) => r.status === 'PENDING').length,
              totalDuration: recordings.reduce((acc: number, r: any) => acc + (r.duration || 0), 0)
            }
            
            setStats(stats)
            setRecentRecordings(recordings.slice(0, 5)) // Show 5 most recent
          }
        } catch (error) {
          console.error('Failed to load dashboard data:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [status, session?.user?.role])

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
    return null // Will redirect
  }

  if (status === 'authenticated' && session?.user?.role === 'OBSERVER') {
    return null // Will redirect to observe
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error'
      case 'MANAGER': return 'warning'
      case 'CONTRIBUTOR': return 'primary'
      case 'OBSERVER': return 'info'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Welcome back, {session?.user?.name}!
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip 
                label={session?.user?.role || 'USER'} 
                size="small" 
                color={getRoleColor(session?.user?.role || '')}
              />
              <Typography variant="body2" color="text.secondary">
                {session?.user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <Mic sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Live Recording
              </Typography>
              <Button 
                component={Link} 
                href="/contribute/live" 
                variant="contained" 
                fullWidth
                size="small"
              >
                Start Recording
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <Upload sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Upload Recording
              </Typography>
              <Button 
                component={Link} 
                href="/contribute/offline" 
                variant="outlined" 
                fullWidth
                size="small"
              >
                Upload File
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <History sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                My Recordings
              </Typography>
              <Button 
                component={Link} 
                href="/dashboard/recordings" 
                variant="outlined" 
                fullWidth
                size="small"
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              <PlayArrow sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Listen
              </Typography>
              <Button 
                component={Link} 
                href="/playback" 
                variant="outlined" 
                fullWidth
                size="small"
              >
                Play Recordings
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stats Overview */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Your Contribution Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.main">
                      {stats.totalRecordings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Recordings
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main">
                      {stats.approvedRecordings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main">
                      {stats.pendingRecordings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Review
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main">
                      {formatDuration(stats.totalDuration)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Duration
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Recordings
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Loading...</Typography>
              ) : recentRecordings.length === 0 ? (
                <Alert severity="info">
                  No recordings yet. Start by making your first recording!
                </Alert>
              ) : (
                <Box>
                  {recentRecordings.map((recording: any, index) => (
                    <Box key={recording.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <Box>
                          <Typography variant="body1">
                            {recording.originalName || recording.filename}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {recording.nameList?.title} • {formatDuration(recording.duration || 0)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={recording.status} 
                          size="small" 
                          color={recording.status === 'APPROVED' ? 'success' : 'warning'}
                        />
                      </Box>
                      {index < recentRecordings.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button component={Link} href="/dashboard/recordings" variant="outlined" size="small">
                      View All Recordings
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} />
                Project Progress
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h2" color="primary.main">
                  5000
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target Recordings
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Help us reach our goal of collecting 5,000 community recordings for the exhibition!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}