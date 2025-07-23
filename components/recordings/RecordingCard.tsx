import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  Delete,
  Visibility,
  Upload,
  Mic,
} from '@mui/icons-material';
import { Recording } from '@/types/recording';
import { formatFileSize, formatDuration, formatTimeAgo } from '@/utils/formatters';
import { getStatusColor, getStatusIcon } from '@/utils/recording-helpers';

interface RecordingCardProps {
  recording: Recording;
  isPlaying: boolean;
  onPlayPause: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
}

export const RecordingCard = ({
  recording,
  isPlaying,
  onPlayPause,
  onViewDetails,
  onDelete,
}: RecordingCardProps) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ 
          mr: 2, 
          bgcolor: recording.recordingMethod === 'LIVE' ? 'primary.main' : 'secondary.main' 
        }}>
          {recording.recordingMethod === 'LIVE' ? <Mic /> : <Upload />}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" noWrap>
            {recording.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {recording.nameList?.title || 'No name list'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Chip
          icon={getStatusIcon(recording.status)}
          label={recording.status}
          color={getStatusColor(recording.status) as any}
          size="small"
          sx={{ mr: 1 }}
        />
        {recording.exhibitionOrder && (
          <Chip
            label={`Queue #${recording.exhibitionOrder}`}
            variant="outlined"
            size="small"
          />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Duration: {formatDuration(recording.duration)}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Size: {formatFileSize(recording.fileSize)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatTimeAgo(recording.createdAt)}
      </Typography>
      
      {recording.notes && (
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          "{recording.notes}"
        </Typography>
      )}
    </CardContent>

    <CardActions>
      <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
        <IconButton onClick={onPlayPause} color="primary">
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title="View Details">
        <IconButton onClick={onViewDetails}>
          <Visibility />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Download">
        <IconButton
          component="a"
          href={`/api/recordings/${recording.id}/download`}
          download
        >
          <Download />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Delete">
        <IconButton onClick={onDelete} color="error">
          <Delete />
        </IconButton>
      </Tooltip>
    </CardActions>
  </Card>
);