import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Avatar,
  Typography,
  Box,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import { useState } from 'react';
import {
  PlayArrow,
  Pause,
  MoreVert,
  CheckCircle,
  Cancel,
  Download,
  Delete,
  Visibility,
  PlaylistAdd,
  Person,
  Mic,
  Upload,
} from '@mui/icons-material';
import { AdminRecording } from '@/types/admin';
import { formatDuration, formatFileSize, formatTimeAgo } from '@/utils/formatters';
import { getStatusColor, getStatusIcon } from '@/utils/recording-helpers';

interface AdminRecordingTableProps {
  recordings: AdminRecording[];
  selectedRecordings: string[];
  onToggleSelection: (recordingId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  playingId: string | null;
  onPlayPause: (recordingId: string) => void;
  onStatusChange: (recordingId: string, status: string) => void;
  onDelete: (recordingId: string) => void;
  onViewDetails: (recording: AdminRecording) => void;
  onAddToQueue: (recordingId: string) => void;
}

export const AdminRecordingTable = ({
  recordings,
  selectedRecordings,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  playingId,
  onPlayPause,
  onStatusChange,
  onDelete,
  onViewDetails,
  onAddToQueue,
}: AdminRecordingTableProps) => {
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRecording, setSelectedRecording] = useState<AdminRecording | null>(null);

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, recording: AdminRecording) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedRecording(recording);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedRecording(null);
  };

  const allSelected = recordings.length > 0 && selectedRecordings.length === recordings.length;
  const someSelected = selectedRecordings.length > 0 && selectedRecordings.length < recordings.length;

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={someSelected}
                  checked={allSelected}
                  onChange={allSelected ? onClearSelection : onSelectAll}
                />
              </TableCell>
              <TableCell>Recording</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recordings.map((recording) => (
              <TableRow
                key={recording.id}
                selected={selectedRecordings.includes(recording.id)}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onViewDetails(recording)}
              >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRecordings.includes(recording.id)}
                    onChange={() => onToggleSelection(recording.id)}
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPause(recording.id);
                      }}
                      color="primary"
                    >
                      {playingId === recording.id ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    <Box>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {recording.title}
                      </Typography>
                      {recording.nameList?.title && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {recording.nameList.title}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                        {recording.user.name || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {recording.user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    icon={getStatusIcon(recording.status)}
                    label={recording.status}
                    color={getStatusColor(recording.status) as any}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    icon={recording.recordingMethod === 'LIVE' ? <Mic /> : <Upload />}
                    label={recording.recordingMethod}
                    variant="outlined"
                    size="small"
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
                    {formatTimeAgo(recording.createdAt)}
                  </Typography>
                </TableCell>

                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, recording)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => {
          if (selectedRecording) onViewDetails(selectedRecording);
          handleActionClose();
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (selectedRecording) onStatusChange(selectedRecording.id, 'APPROVED');
          handleActionClose();
        }}>
          <CheckCircle sx={{ mr: 1 }} color="success" />
          Approve
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (selectedRecording) onStatusChange(selectedRecording.id, 'REJECTED');
          handleActionClose();
        }}>
          <Cancel sx={{ mr: 1 }} color="error" />
          Reject
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (selectedRecording) onAddToQueue(selectedRecording.id);
          handleActionClose();
        }}>
          <PlaylistAdd sx={{ mr: 1 }} />
          Add to Exhibition
        </MenuItem>
        
        <MenuItem 
          component="a"
          href={selectedRecording ? `/api/recordings/${selectedRecording.id}/download` : '#'}
          download
          onClick={handleActionClose}
        >
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (selectedRecording) onDelete(selectedRecording.id);
            handleActionClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};