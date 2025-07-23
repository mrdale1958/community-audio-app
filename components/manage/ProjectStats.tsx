// components/manage/ProjectStats.tsx
import React from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography
} from '@mui/material'
import type { ProjectStats as ProjectStatsType } from '@/types/manage'

interface ProjectStatsProps {
  stats: ProjectStatsType | null
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!stats) return null

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="primary.main">
              {stats.totalRecordings}
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
            <Typography variant="h3" color="warning.main">
              {stats.pendingRecordings}
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
              {stats.totalUsers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Users
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {formatFileSize(stats.totalFileSize)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Storage
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}