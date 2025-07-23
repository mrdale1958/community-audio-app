// components/manage/RecordingsTab.tsx
import React, { useState } from 'react'
import {
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Pagination
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  CheckCircle,
  Cancel,
  Delete,
  Info,
  Mic,
  Upload
} from '@mui/icons-material'
import { RecordingDetailsDialog } from '@/components/manage/RecordingDetailsDialog'
import type { Recording } from '@/types/manage'

interface RecordingsTabProps {
  recordings: Recording[]
  playingId: string | null
  onToggleAudio: (recording: Recording) => void
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void
  onDeleteRecording: (id: string) => void
}

export function RecordingsTab({ 
  recordings, 
  playingId, 
  onToggleAudio, 
  onUpdateStatus, 
  onDeleteRecording 
}: RecordingsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const itemsPerPage = 10

  // Utility functions
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

  // Filter recordings
  const filteredRecordings = recordings.filter(recording => {
    const matchesStatus = statusFilter === 'ALL' || recording.status === statusFilter
    const matchesSearch = !searchQuery || 
      recording.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recording.nameList.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recording.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // Pagination
  const paginatedRecordings = filteredRecordings.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <CardContent>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          size="small"
          placeholder="Search recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
      </Box>

      {/* Recordings Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Recording</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Name List</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRecordings.map((recording) => (
              <TableRow key={recording.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleAudio(recording)}
                      disabled={!recording.filename}
                    >
                      {playingId === recording.id ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    <Box>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {recording.originalName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {recording.filename}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {recording.user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recording.user.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {recording.nameList.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={recording.status}
                    size="small"
                    color={getStatusColor(recording.status) as any}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={recording.method === 'LIVE' ? <Mic /> : <Upload />}
                    label={recording.method}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDuration(recording.duration)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatFileSize(recording.fileSize)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(recording.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {recording.status === 'PENDING' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onUpdateStatus(recording.id, 'APPROVED')}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onUpdateStatus(recording.id, 'REJECTED')}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedRecording(recording)
                          setShowDialog(true)
                        }}
                      >
                        <Info />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteRecording(recording.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={Math.ceil(filteredRecordings.length / itemsPerPage)}
          page={page}
          onChange={(e, newPage) => setPage(newPage)}
          color="primary"
        />
      </Box>

      {/* Recording Details Dialog */}
      <RecordingDetailsDialog
        recording={selectedRecording}
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDeleteRecording}
      />
    </CardContent>
  )
}