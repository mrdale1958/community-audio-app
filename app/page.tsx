'use client'

import { Container, Typography, Box, Card, CardContent, Grid, Button } from '@mui/material'
import { Mic, Upload, PlayArrow, Visibility, Settings } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect unauthenticated users to /observe
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/observe')
    }
  }, [status, router])

  // Show loading while checking authentication or redirecting
  if (status === 'loading' || status === 'unauthenticated') {
    return null // Don't render anything while redirecting
  }

  // Show appropriate interface based on user role
  const userRole = session?.user?.role

  // OBSERVER users see observe page content but with upgrade option
  if (userRole === 'OBSERVER') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome, Observer
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            You're currently observing the project. Ready to contribute recordings?
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={6}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: 'info.main', mb: 2 }}>
                  <Visibility sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Project Progress
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  View community progress and listen to approved recordings
                </Typography>
                <Button component={Link} href="/observe" variant="contained" fullWidth>
                  View Progress
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: 'success.main', mb: 2 }}>
                  <PlayArrow sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Listen to Recordings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Experience the community recordings in our exhibition player
                </Typography>
                <Button component={Link} href="/playback" variant="contained" fullWidth>
                  Listen
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <CardContent sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Become a Contributor
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Upgrade your account to start recording and contribute to the community audio collection.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              onClick={() => router.push('/dashboard/upgrade')}
            >
              Become a Contributor
            </Button>
          </CardContent>
        </Card>
      </Container>
    )
  }

  // CONTRIBUTOR, MANAGER, ADMIN users see full interface
  const userModes = [
    {
      title: 'Live Recording',
      description: 'Record audio directly in your browser while viewing the names',
      icon: <Mic sx={{ fontSize: 40 }} />,
      href: '/contribute/live',
      color: 'primary.main'
    },
    {
      title: 'Offline Contribution',
      description: 'Download name lists and upload your audio recordings',
      icon: <Upload sx={{ fontSize: 40 }} />,
      href: '/contribute/offline',
      color: 'secondary.main'
    },
    {
      title: 'Playback',
      description: 'Listen to community recordings',
      icon: <PlayArrow sx={{ fontSize: 40 }} />,
      href: '/playback',
      color: 'success.main'
    },
    {
      title: 'Project Progress',
      description: 'View project progress and statistics',
      icon: <Visibility sx={{ fontSize: 40 }} />,
      href: '/observe',
      color: 'info.main'
    }
  ]

  // Add manage option for admin/manager
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    userModes.push({
      title: 'Manage',
      description: 'Administrative tools and project management',
      icon: <Settings sx={{ fontSize: 40 }} />,
      href: '/manage',
      color: 'warning.main'
    })
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Community Audio Recording Project
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Collecting community voices, one name at a time
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {userModes.map((mode) => (
          <Grid item xs={12} sm={6} md={4} key={mode.title}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: mode.color, mb: 2 }}>
                  {mode.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {mode.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {mode.description}
                </Typography>
                <Button
                  component={Link}
                  href={mode.href}
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: mode.color,
                    '&:hover': {
                      backgroundColor: mode.color,
                      filter: 'brightness(0.9)'
                    }
                  }}
                >
                  Enter
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box textAlign="center" mt={6}>
        <Typography variant="body1" color="text.secondary">
          Want to manage your recordings? <Link href="/dashboard">Visit your dashboard</Link>
        </Typography>
      </Box>
    </Container>
  )
}