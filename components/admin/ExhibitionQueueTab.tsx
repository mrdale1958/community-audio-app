import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import {
  PlayArrow,
  Pause,
  Delete,
  DragIndicator,
  ArrowUpward,
  ArrowDownward,
  Person,
  Mic,
  Upload,
} from '@mui/icons-material';
import { ExhibitionQueue } from '@/types/admin';
import { formatDuration, formatTimeAgo } from '@/utils/formatters';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface ExhibitionQueueTabProps {
  queue: ExhibitionQueue[];
  loading: boolean;
  onRemoveFromQueue: (queueId: string) => Promise<boolean>;
  onReorderQueue: (queueId: string, newPosition: number) => Promise<boolean>;
}

export const ExhibitionQueueTab = ({
  queue,
  loading,
  onRemoveFromQueue,
  onReorderQueue,
}: ExhibitionQueueTabProps) => {
  const { playingId, playPause } = useAudioPlayer();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<ExhibitionQueue | null>(null);
  const [newPositionDialogOpen, setNewPositionDialogOpen] = useState(false);
  const [newPosition, setNewPosition] = useState('');

  const handleRemove = async () => {
    if (selectedQueueItem) {
      await onRemoveFromQueue(selectedQueueItem.id);
      setRemoveDialogOpen(false);
      setSelectedQueueItem(null);
    }
  };

  const handleReorder = async () => {
    if (selectedQueueItem && newPosition) {
      await onReorderQueue(selectedQueueItem.id, parseInt(newPosition));
      setNewPositionDialogOpen(false);
      setSelectedQueueItem(null);
      setNewPosition('');
    }
  };

  const moveUp = async (item: ExhibitionQueue) => {
    if (item.position > 1) {
      await onReorderQueue(item.id, item.position - 1);
    }
  };

  const moveDown = async (item: ExhibitionQueue) => {
    if (item.position < queue.length) {
      await onReorderQueue(item.id, item.position + 1);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading exhibition queue...</Typography>
      </Box>
    );
  }

  if (queue.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" gutterBottom>
            Exhibition Queue is Empty
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Add approved recordings to the exhibition queue to start building your playlist.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Go to the "All Recordings" tab and use the "Add to Exhibition" action on approved recordings.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Sort queue by position
  const sortedQueue = [...queue].sort((a, b) => a.position - b.position);

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Exhibition Queue ({queue.length} recordings)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is the order recordings will play in the exhibition. Drag to reorder or use the arrow buttons.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <List>
          {sortedQueue.map((item, index) => (
            <ListItem
              key={item.id}
              divider={index < sortedQueue.length - 1}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <DragIndicator sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
                  {item.position}
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={() => playPause(item.recording.id)}
                color="primary"
                sx={{ mr: 2 }}
              >
                {playingId === item.recording.id ? <Pause /> : <PlayArrow />}
              </IconButton>

              <Avatar sx={{ mr: 2 }}>
                <Person />
              </Avatar>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {item.recording.title}
                    </Typography>
                    <Chip
                      icon={item.recording.recordingMethod === 'LIVE' ? <Mic /> : <Upload />}
                      label={item.recording.recordingMethod}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      By: {item.recording.user.name || 'Anonymous'} ({item.recording.user.email})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {formatDuration(item.recording.duration)} • 
                      Added: {formatTimeAgo(item.createdAt)}
                    </Typography>
                    {item.recording.nameList && (
                      <Typography variant="body2" color="text.secondary">
                        Name List: {item.recording.nameList.title}
                      </Typography>
                    )}
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => moveUp(item)}
                    disabled={item.position === 1}
                    title="Move up"
                  >
                    <ArrowUpward />
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={() => moveDown(item)}
                    disabled={item.position === queue.length}
                    title="Move down"
                  >
                    <ArrowDownward />
                  </IconButton>

                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedQueueItem(item);
                      setNewPosition(item.position.toString());
                      setNewPositionDialogOpen(true);
                    }}
                  >
                    Move to...
                  </Button>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setSelectedQueueItem(item);
                      setRemoveDialogOpen(true);
                    }}
                    title="Remove from queue"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Card>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
        <DialogTitle>Remove from Exhibition Queue</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{selectedQueueItem?.recording.title}" from the exhibition queue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemove} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={newPositionDialogOpen} onClose={() => setNewPositionDialogOpen(false)}>
        <DialogTitle>Move Recording</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Move "{selectedQueueItem?.recording.title}" to a new position in the queue.
          </Typography>
          <TextField
            fullWidth
            label="New Position"
            type="number"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            inputProps={{ min: 1, max: queue.length }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPositionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReorder} 
            variant="contained"
            disabled={!newPosition || parseInt(newPosition) < 1 || parseInt(newPosition) > queue.length}
          >
            Move
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};