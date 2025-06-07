import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Avatar,
} from '@mui/material';
import { useState } from 'react';
import {
  PlayArrow,
  Pause,
  Download,
  Person,
  Mic,
  Upload,
  CheckCircle,
  Cancel,
  PlaylistAdd,
} from '@mui/icons-material';
import { AdminRecording } from '@/types/admin';
import { formatFileSize, formatDuration } from '@/utils/formatters';
import { getStatusColor, getStatusIcon } from '@/utils/recording-helpers';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface AdminRecordingDetailsDialogProps {
  recording: AdminRecording | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (recordingId: string, status: string, notes?: string) => Promise<any>;
  onAddToQueue: (recordingId: string) => Promise<boolean>;
}

export const AdminRecordingDetailsDialog = ({
  recording,
  open,
  onClose,
  onStatusChange,
  onAddToQueue,
}: AdminRecordingDetailsDialogProps) => {
  const { playingId, playPause } = useAudioPlayer();
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (!recording || !newStatus) return;
    
    setUpdating(true);
    try {
      await onStatusChange(recording.id, newStatus, notes);
      setNewStatus('');
      setNotes('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!recording) return;
    
    try {
      await onAddToQueue(recording.id);
    } catch (error) {
      console.error('Failed to add to queue:', error);
    }
  };

  if (!recording) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => playPause(recording.id)}
            color="primary"
          >
            {playingId === recording.id ? <Pause /> : <PlayArrow />}
          </IconButton>
          Recording Details
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Recording Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Recording Information</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Title</Typography>
              <Typography gutterBottom>{recording.title}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Status</Typography>
              <Chip
                icon={getStatusIcon(recording.status)}
                label={recording.status}
                color={getStatusColor(recording.status) as any}
                sx={{ mb: 1 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Recording Method</Typography>
              <Chip
                icon={recording.recordingMethod === 'LIVE' ? <Mic /> : <Upload />}
                label={recording.recordingMethod}
                variant="outlined"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>File Details</Typography>
              <Typography variant="body2">Duration: {formatDuration(recording.duration)}</Typography>
              <Typography variant="body2">Size: {formatFileSize(recording.fileSize)}</Typography>
              <Typography variant="body2">Type: {recording.mimeType}</Typography>
            </Box>

            {recording.nameList && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Name List</Typography>
                <Typography variant="body2">
                  {recording.nameList.title}
                  {recording.nameList.pageNumber && ` (Page ${recording.nameList.pageNumber})`}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Dates</Typography>
              <Typography variant="body2">
                Created: {new Date(recording.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Updated: {new Date(recording.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          {/* User Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>User Information</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {recording.user.name || 'Anonymous User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {recording.user.email}
                </Typography>
                <Chip label={recording.user.role} size="small" variant="outlined" />
              </Box>
            </Box>

            {recording.notes && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Current Notes</Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  "{recording.notes}"
                </Typography>
              </Box>
            )}

            {/* Admin Actions */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Admin Actions
            </Typography>

            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Change Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Change Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="PROCESSING">Processing</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleStatusUpdate}
                disabled={!newStatus || updating}
                sx={{ mb: 1 }}
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<CheckCircle />}
                color="success"
                variant="outlined"
                onClick={() => {
                  setNewStatus('APPROVED');
                  handleStatusUpdate();
                }}
                disabled={updating}
              >
                Quick Approve
              </Button>

              <Button
                startIcon={<Cancel />}
                color="error"
                variant="outlined"
                onClick={() => {
                  setNewStatus('REJECTED');
                  handleStatusUpdate();
                }}
                disabled={updating}
              >
                Quick Reject
              </Button>

              <Button
                startIcon={<PlaylistAdd />}
                color="info"
                variant="outlined"
                onClick={handleAddToQueue}
              >
                Add to Exhibition
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<Download />}
          component="a"
          href={`/api/recordings/${recording.id}/download`}
          download
        >
          Download
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};