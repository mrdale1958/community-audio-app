import { Container, Typography, Box, Card, CardContent, Grid, Button } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SettingsIcon from '@mui/icons-material/Settings'
import Link from 'next/link'

export default function HomePage() {
  const userModes = [
    {
      title: 'Live Recording',
      description: 'Record audio directly in your browser while viewing the names',
      icon: <MicIcon sx={{ fontSize: 40 }} />,
      href: '/contribute/live',
      color: 'primary.main'
    },
    {
      title: 'Offline Contribution', 
      description: 'Download name lists and upload your audio recordings',
      icon: <UploadFileIcon sx={{ fontSize: 40 }} />,
      href: '/contribute/offline',
      color: 'secondary.main'
    },
    {
      title: 'Playback',
      description: 'Listen to community recordings',
      icon: <PlayArrowIcon sx={{ fontSize: 40 }} />,
      href: '/playback',
      color: 'success.main'
    },
    {
      title: 'Observe',
      description: 'View project progress and statistics',
      icon: <VisibilityIcon sx={{ fontSize: 40 }} />,
      href: '/observe',
      color: 'info.main'
    },
    {
      title: 'Manage',
      description: 'Administrative tools and project management',
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      href: '/admin',
      color: 'warning.main'
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Read My Name
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Collecting readings of the names from the AIDS Memorial Quilt
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
          New to the project? <Link href="/dashboard/profile">Set up your profile</Link> to get started.
        </Typography>
      </Box>
    </Container>
  )
}