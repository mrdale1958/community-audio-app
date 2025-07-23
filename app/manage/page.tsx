// app/manage/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Tabs,
  Tab,
  Badge,
  Snackbar
} from '@mui/material'
import {
  People,
  QueueMusic,
  Analytics,
  Refresh
} from '@mui/icons-material'

import { ProjectStats } from '../../components/manage/ProjectStats'
import { RecordingsTab } from '../../components/manage/RecordingsTab'
import { UsersTab } from '../../components/manage/UsersTab'
import { AnalyticsTab } from '../../components/manage/AnalyticsTab'
import { useManageData } from '../../hooks/useManageData'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import type { Recording, User, ProjectStats as ProjectStatsType, NewUserData } from '../../types/manage'

export default function ManagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [currentTab, setCurrentTab] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Custom hooks for data management
  const {
    recordings,
    users,
    setUsers,
    stats,
    isLoading,
    error,
    setError,
    loadAllData,
    loadStats,
    updateRecordingStatus,
    deleteRecording,
    updateUserRole,
    deleteUser
  } = useManageData()

  const { playingId, toggleAudio } = useAudioPlayer()

  // Check admin access
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  // Success message handler
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessMessage(true)
  }

  // Load data on mount
  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      loadAllData()
    }
  }, [status, isAdmin, loadAllData])

  // Access control
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
          Please sign in to access the management interface.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        </Box>
      </Container>
    )
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. Administrator privileges required.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Project Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadAllData}
          disabled={isLoading}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Project Statistics */}
      <ProjectStats stats={stats} />

      {/* Management Tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab 
              icon={<Badge badgeContent={stats?.pendingRecordings || 0} color="warning"><QueueMusic /></Badge>} 
              label="Recordings" 
            />
            <Tab icon={<People />} label="Users" />
            <Tab icon={<Analytics />} label="Analytics" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && (
          <RecordingsTab
            recordings={recordings}
            playingId={playingId}
            onToggleAudio={toggleAudio}
            onUpdateStatus={(id: string, status: 'APPROVED' | 'REJECTED') => {
              updateRecordingStatus(id, status)
              showSuccess(`Recording ${status.toLowerCase()}`)
            }}
            onDeleteRecording={(id: string) => {
              deleteRecording(id)
              showSuccess('Recording deleted')
            }}
          />
        )}

        {currentTab === 1 && (
          <UsersTab
            users={users}
            onUpdateRole={(id: string, role: string) => {
              updateUserRole(id, role)
              showSuccess(`User role updated to ${role}`)
            }}
            onAddUser={(user: User) => {
              // User was successfully created, just update the UI
              setUsers(prev => [user, ...prev])
              loadStats()
              showSuccess('User created successfully')
            }}
            onDeleteUser={(user: User) => {
              deleteUser(user.id)
              showSuccess('User and all their recordings deleted successfully')
            }}
          />
        )}

        {currentTab === 2 && (
          <AnalyticsTab stats={stats} users={users} />
        )}
      </Box>

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