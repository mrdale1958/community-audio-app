'use client'

import { Container, Typography, Box, Card, CardContent, Grid, Button } from '@mui/material'
import {
  Mic,
  Upload,
  PlayArrow,
  Visibility,
  Settings,
  GraphicEq,
  Dashboard as DashboardIcon,
  Analytics,
  People,
  Assessment
} from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    }
  }, [status, router])

  // Show loading while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return null
  }

  const userRole = session?.user?.role

  const [stats, setStats] = useState({
    totalNames: 0,
    totalPages: 0,
    totalRecorded: 0,
    remainingNames: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(apiUrl('/api/stats'));
        if (!res.ok) {
          throw new Error(`Failed to fetch stats: ${res.status}`);
        }
        const response = await res.json();
        console.log('Stats API response:', response);
        if (response.success && response.data) {
          setStats({
            totalNames: response.data.totalNames || 0,
            totalPages: response.data.totalPages || 0,
            totalRecorded: response.data.approvedRecordings || 0,
            remainingNames: response.data.remainingNames || 0,
          });
          setError(null); // Clear any previous errors
        } else {
          setError('Invalid response format from stats API');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch stats');
      }
    }
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome back, {session?.user?.name}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {userRole === 'ADMIN' ? 'Full system access - manage users and project settings.' :
           userRole === 'MANAGER' ? 'Manage project content and user contributions.' :
           userRole === 'GALLERIST' ? 'Manage exhibitions and gallery installations.' :
           userRole === 'CONTRIBUTOR' ? 'Ready to contribute more recordings?' :
           'Observe project progress and community contributions.'}
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 4 }}>
          <Typography color="error" variant="body1">
            Error loading dashboard data: {error}
          </Typography>
        </Box>
      )}

      {/* Progress Section - Keep your existing progress bar here */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ py: 3 }}>
          <Typography variant="h5" gutterBottom>
            Call My Name Project Progress
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {stats.totalRecorded} of {stats.totalNames} names recorded
          </Typography>
          <Box sx={{ 
            height: 8, 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            borderRadius: 4,
            mb: 2
          }}>
            <Box sx={{ 
              height: '100%', 
              backgroundColor: 'white', 
              borderRadius: 4,
              width: `${(stats.totalRecorded / stats.totalNames) * 100}%` 
            }} />
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight="bold">{stats.totalNames}</Typography>
              <Typography variant="body2">Total Names</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight="bold">{stats.totalRecorded}</Typography>
              <Typography variant="body2">Recorded</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight="bold">{stats.totalPages}</Typography>
              <Typography variant="body2">Total Pages</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" fontWeight="bold">{stats.remainingNames}</Typography>
              <Typography variant="body2">Remaining</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Actions Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recording Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1
            }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Mic color="primary" />
                <Typography variant="h6">Record Names</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                Contribute to the Call My Name Project by recording names live through your browser.
              </Typography>
              <Typography variant="caption" color="primary" sx={{ mb: 2 }}>
                {stats.remainingNames} names remaining
              </Typography>
              <Button
                component={Link}
                href="/contribute/live"
                variant="contained"
                fullWidth
                sx={{ minHeight: '40px' }}
              >
                Start Recording
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1
            }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Upload color="secondary" />
                <Typography variant="h6">Upload Recordings</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                Upload recordings you;lsqout;ve made offline using downloaded name lists.
              </Typography>
              <Button
                component={Link}
                href="/contribute/offline"
                variant="contained"
                color="secondary"
                fullWidth
                sx={{ minHeight: '40px' }}
              >
                Upload Files
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Management Section - Only for Admin/Manager */}
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Assessment color="info" />
                    <Typography variant="h6">Review Recordings</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                    Review submitted recordings and manage approval status.
                  </Typography>
                  <Button
                    component={Link}
                    href="/manage/recordings"
                    variant="outlined"
                    fullWidth
                    sx={{ minHeight: '40px' }}
                  >
                    Review Queue
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Analytics color="success" />
                    <Typography variant="h6">Project Analytics</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                    View detailed project statistics and progress reports.
                  </Typography>
                  <Button
                    component={Link}
                    href="/manage/analytics"
                    variant="outlined"
                    color="success"
                    fullWidth
                    sx={{ minHeight: '40px' }}
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Exhibition Control - Only for Admin/Manager/Gallerist */}
        {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'GALLERIST') && (
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1
              }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <GraphicEq sx={{ color: 'white' }} />
                  <Typography variant="h6">Exhibition Control</Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, flexGrow: 1 }}>
                  Manage live gallery audio playback, sound systems, and exhibition settings.
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, mb: 2, display: 'block' }}>
                  Professional gallery audio management
                </Typography>
                <Button
                  component={Link}
                  href="/exhibition/control"
                  variant="contained"
                  fullWidth
                  sx={{ 
                    minHeight: '40px',
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  Open Control Center
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Admin Only - User Management */}
        {userRole === 'ADMIN' && (
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1
              }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <People color="warning" />
                  <Typography variant="h6">User Management</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                  Manage user accounts, roles, and permissions.
                </Typography>
                <Button
                  component={Link}
                  href="/manage/users"
                  variant="outlined"
                  color="warning"
                  fullWidth
                  sx={{ minHeight: '40px' }}
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Quick Links */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Links
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                component={Link}
                href="/playback"
                startIcon={<PlayArrow />}
                variant="text"
              >
                Listen to Recordings
              </Button>
            </Grid>
            <Grid item>
              <Button
                component={Link}
                href="/observe"
                startIcon={<Visibility />}
                variant="text"
              >
                Project Progress
              </Button>
            </Grid>
            <Grid item>
              <Button
                component={Link}
                href="/dashboard/recordings"
                startIcon={<DashboardIcon />}
                variant="text"
              >
                My Recordings
              </Button>
            </Grid>
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
              <Grid item>
                <Button
                  component={Link}
                  href="/manage"
                  startIcon={<Settings />}
                  variant="text"
                >
                  Administration
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Container>
  )
}