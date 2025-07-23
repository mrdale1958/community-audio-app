'use client'

import React, { useState } from 'react'
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material'
import {
  Upgrade,
  Mic,
  Upload,
  Dashboard,
  CheckCircle,
  ArrowForward
} from '@mui/icons-material'

export default function UpgradePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const handleUpgrade = async () => {
    if (!session?.user?.id) return
    
    setIsUpgrading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/users/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upgrade account')
      }
      
      setShowConfirmDialog(false)
      setShowSuccessMessage(true)
      
      // Force a full page reload to refresh the session
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade account')
      console.error('Upgrade error:', err)
    } finally {
      setIsUpgrading(false)
    }
  }

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
    router.push('/auth/signin')
    return null
  }

  // Redirect if already a contributor or higher
  if (session?.user?.role !== 'OBSERVER') {
    router.push('/dashboard')
    return null
  }

  const contributorFeatures = [
    {
      icon: <Mic />,
      title: 'Live Recording',
      description: 'Record audio directly in your browser while viewing name lists'
    },
    {
      icon: <Upload />,
      title: 'File Upload',
      description: 'Download PDFs and upload your own recorded audio files'
    },
    {
      icon: <Dashboard />,
      title: 'Personal Dashboard',
      description: 'Manage your recordings, view status, and track your contributions'
    }
  ]

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Upgrade sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Become a Contributor
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Upgrade your account to start contributing audio recordings to our community project
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Current Status */}
      <Card sx={{ mb: 4, bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Status: Observer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can currently view project progress and listen to approved recordings, but cannot contribute your own recordings.
          </Typography>
        </CardContent>
      </Card>

      {/* Contributor Benefits */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            What you'll gain as a Contributor:
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {contributorFeatures.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" gutterBottom>
            Ready to Start Contributing?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Join our community of contributors and help us preserve these important names through audio recordings.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<ArrowForward />}
            onClick={() => setShowConfirmDialog(true)}
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main', 
              '&:hover': { bgcolor: 'grey.100' },
              minWidth: 200
            }}
          >
            Upgrade Now
          </Button>
          
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
            This upgrade is free and immediate
          </Typography>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => !isUpgrading && setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Account Upgrade</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to upgrade your account to Contributor status?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will give you access to recording features and your personal dashboard. You can't undo this change, but it unlocks the full experience of our community project.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} disabled={isUpgrading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade} 
            variant="contained" 
            disabled={isUpgrading}
            startIcon={isUpgrading ? null : <Upgrade />}
          >
            {isUpgrading ? 'Upgrading...' : 'Upgrade to Contributor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Welcome to the contributor community! Redirecting to your dashboard...
        </Alert>
      </Snackbar>
    </Container>
  )
}