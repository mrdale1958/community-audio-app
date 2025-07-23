import { Card, CardContent, Typography, Button } from '@mui/material';
import { Mic } from '@mui/icons-material';

interface EmptyStateProps {
  hasRecordings: boolean;
}

export const EmptyState = ({ hasRecordings }: EmptyStateProps) => (
  <Card>
    <CardContent sx={{ textAlign: 'center', py: 6 }}>
      <Mic sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {!hasRecordings ? 'No recordings yet' : 'No recordings match your filters'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {!hasRecordings 
          ? 'Start contributing by making your first recording!'
          : 'Try adjusting your search or filter criteria.'
        }
      </Typography>
      {!hasRecordings && (
        <Button variant="contained" href="/contribute">
          Start Recording
        </Button>
      )}
    </CardContent>
  </Card>
);