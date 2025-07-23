// components/manage/AnalyticsTab.tsx
import React from 'react'
import {
  CardContent,
  Typography,
  Grid,
  Card,
  Box,
  LinearProgress
} from '@mui/material'
import type { ProjectStats, User } from '@/types/manage'

interface AnalyticsTabProps {
  stats: ProjectStats | null
  users: User[]
}

export function AnalyticsTab({ stats, users }: AnalyticsTabProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Project Analytics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Recording Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Total Recordings:</strong> {stats?.totalRecordings || 0}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Approved:</strong> {stats?.approvedRecordings || 0}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Pending:</strong> {stats?.pendingRecordings || 0}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Rejected:</strong> {stats?.rejectedRecordings || 0}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Total Duration:</strong> {formatDuration(stats?.totalDuration || 0)}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Storage:</strong> {formatFileSize(stats?.totalFileSize || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                User Statistics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Total Users:</strong> {stats?.totalUsers || 0}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Admins:</strong> {users.filter(u => u.role === 'ADMIN').length}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Managers:</strong> {users.filter(u => u.role === 'MANAGER').length}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Contributors:</strong> {users.filter(u => u.role === 'CONTRIBUTOR').length}
                </Typography>
                <Typography variant="body1">
                  <strong>Observers:</strong> {users.filter(u => u.role === 'OBSERVER').length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Progress Toward Goal
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Target: 5,000 recordings | Current: {stats?.approvedRecordings || 0} approved
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(((stats?.approvedRecordings || 0) / 5000) * 100, 100)} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {((stats?.approvedRecordings || 0) / 5000 * 100).toFixed(1)}% complete
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Name Lists
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  <strong>Total Name Lists:</strong> {stats?.totalNameLists || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Each name list contains names for contributors to record
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </CardContent>
  )
}