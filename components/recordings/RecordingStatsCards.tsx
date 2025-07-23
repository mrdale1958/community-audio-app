import { Grid, Card, CardContent, Typography } from '@mui/material';
import { RecordingStats } from '@/types/recording';
import { formatDuration } from '@/utils/formatters';

interface RecordingStatsCardsProps {
  stats: RecordingStats;
}

export const RecordingStatsCards = ({ stats }: RecordingStatsCardsProps) => (
  <Grid container spacing={3} sx={{ mb: 4 }}>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>Total Recordings</Typography>
          <Typography variant="h4">{stats.total}</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>Approved</Typography>
          <Typography variant="h4" color="success.main">{stats.approved}</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>Total Duration</Typography>
          <Typography variant="h4">{formatDuration(stats.totalDuration)}</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
        <Typography color="textSecondary" gutterBottom>Avg Duration</Typography>
          <Typography variant="h4">{formatDuration(stats.avgDuration)}</Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);