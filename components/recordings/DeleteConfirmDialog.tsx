import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Recording } from '@/types/recording';

interface DeleteConfirmDialogProps {
  recording: Recording | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog = ({
  recording,
  open,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Recording</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete "{recording?.title}"? 
        This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);