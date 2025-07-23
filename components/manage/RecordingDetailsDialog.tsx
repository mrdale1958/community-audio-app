import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Chip
} from '@mui/material'
import { Mic, Upload } from '@mui/icons-material'
import type { Recording } from '@/types/manage'

interface RecordingDetailsDialogProps {
  recording: Recording | null
  open: boolean
  onClose: () => void
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void
  onDelete: (id: string) => void
}

export function RecordingDetailsDialog({ 
  recording, 
  open, 
  onClose, 
  onUpdateStatus, 
  onDelete 
}: RecordingDetailsDialogProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'error'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  if (!recording) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Recording Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Original Name
              </Typography>
              <Typography variant="body1" gutterBottom>
                {recording.originalName}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                File Name
              </Typography>
              <Typography variant="body1" gutterBottom>
                {recording.filename}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                User
              </Typography>
              <Typography variant="body1" gutterBottom>
                {recording.user.name} ({recording.user.email})
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Name List
              </Typography>
              <Typography variant="body1" gutterBottom>
                {recording.nameList.title}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={recording.status}
                size="small"
                color={getStatusColor(recording.status) as any}
                sx={{ mt: 0.5 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Method
              </Typography>
              <Chip
                icon={recording.method === 'LIVE' ? <Mic /> : <Upload />}
                label={recording.method}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDuration(recording.duration)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                File Size
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatFileSize(recording.fileSize)}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Upload Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {new Date(recording.createdAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {recording.status === 'PENDING' && (
          <>
            <Button
              onClick={() => {
                onUpdateStatus(recording.id, 'REJECTED')
                onClose()
              }}
              color="error"
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                onUpdateStatus(recording.id, 'APPROVED')
                onClose()
              }}
              color="success"
              variant="contained"
            >
              Approve
            </Button>
          </>
        )}
        <Button
          onClick={() => {
            onDelete(recording.id)
            onClose()
          }}
          color="error"
          variant="outlined"
        >
          Delete Recording
        </Button>
      </DialogActions>
    </Dialog>
  )
}
