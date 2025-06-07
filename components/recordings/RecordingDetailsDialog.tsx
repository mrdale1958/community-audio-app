// components/recordings/RecordingDetailsDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import { Recording } from '@/types/recording';
import { formatFileSize, formatDuration } from '@/utils/formatters';
import { getStatusColor, getStatusIcon } from '@/utils/recording-helpers';

interface RecordingDetailsDialogProps {
  recording: Recording | null;
  open: boolean;
  onClose: () => void;
}

export const RecordingDetailsDialog = ({
  recording,
  open,
  onClose,
}: RecordingDetailsDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    {recording && (
      <>
        <DialogTitle>Recording Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>File Name</Typography>
              <Typography gutterBottom>{recording.originalName}</Typography>
              
              <Typography variant="subtitle2" gutterBottom>Status</Typography>
              <Chip
                icon={getStatusIcon(recording.status)}
                label={recording.status}
                color={getStatusColor(recording.status) as any}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" gutterBottom>Recording Method</Typography>
              <Typography gutterBottom>{recording.recordingMethod}</Typography>
              
              <Typography variant="subtitle2" gutterBottom>File Size</Typography>
              <Typography gutterBottom>{formatFileSize(recording.fileSize)}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Duration</Typography>
              <Typography gutterBottom>{formatDuration(recording.duration)}</Typography>
              
              <Typography variant="subtitle2" gutterBottom>Name List</Typography>
              <Typography gutterBottom>
                {recording.nameList?.title || 'No name list assigned'}
                {recording.nameList?.pageNumber && ` (Page ${recording.nameList.pageNumber})`}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Created</Typography>
              <Typography gutterBottom>
                {new Date(recording.createdAt).toLocaleString()}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Last Updated</Typography>
              <Typography gutterBottom>
                {new Date(recording.updatedAt).toLocaleString()}
              </Typography>
            </Grid>
            
            {recording.notes && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                <Typography>{recording.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </>
    )}
  </Dialog>
);

