import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { 
  CheckCircle, 
  Cancel, 
  Delete, 
  PlaylistAdd,
  Settings 
} from '@mui/icons-material';
import { BulkAction } from '@/types/admin';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkAction: (action: BulkAction) => Promise<void>;
  onClearSelection: () => void;
  selectedRecordingIds: string[];
}

export const BulkActionsBar = ({ 
  selectedCount, 
  onBulkAction, 
  onClearSelection,
  selectedRecordingIds 
}: BulkActionsBarProps) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const handleBulkAction = (actionType: BulkAction['type']) => {
    const action: BulkAction = {
      type: actionType,
      recordingIds: selectedRecordingIds,
      ...(actionType === 'SET_STATUS' && { newStatus }),
    };

    setPendingAction(action);
    setConfirmDialogOpen(true);
  };

  const confirmAction = async () => {
    if (pendingAction) {
      await onBulkAction(pendingAction);
      setConfirmDialogOpen(false);
      setPendingAction(null);
      onClearSelection();
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        bgcolor: 'background.paper', 
        p: 2, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Chip 
          label={`${selectedCount} recordings selected`} 
          color="primary" 
          onDelete={onClearSelection}
        />

        <Button
          startIcon={<CheckCircle />}
          color="success"
          onClick={() => handleBulkAction('APPROVE')}
        >
          Approve
        </Button>

        <Button
          startIcon={<Cancel />}
          color="error"
          onClick={() => handleBulkAction('REJECT')}
        >
          Reject
        </Button>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Set Status</InputLabel>
          <Select
            value={newStatus}
            label="Set Status"
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
            <MenuItem value="PROCESSING">Processing</MenuItem>
          </Select>
        </FormControl>

        <Button
          startIcon={<Settings />}
          disabled={!newStatus}
          onClick={() => handleBulkAction('SET_STATUS')}
        >
          Apply Status
        </Button>

        <Button
          startIcon={<PlaylistAdd />}
          color="info"
          onClick={() => handleBulkAction('ADD_TO_QUEUE')}
        >
          Add to Exhibition
        </Button>

        <Button
          startIcon={<Delete />}
          color="error"
          variant="outlined"
          onClick={() => handleBulkAction('DELETE')}
        >
          Delete
        </Button>
      </Box>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Bulk Action</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {pendingAction?.type.toLowerCase()} {selectedCount} recordings?
            {pendingAction?.type === 'DELETE' && ' This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmAction} 
            color={pendingAction?.type === 'DELETE' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};