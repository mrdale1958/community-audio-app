import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { AdminStats } from '@/types/admin';
import { formatDuration, formatFileSize } from '@/utils/formatters';

interface AdminStatsOverviewProps {
  stats: AdminStats;
}

export const AdminStatsOverview = ({ stats }: AdminStatsOverviewProps) => (
  <Grid container spacing={3} sx={{ mb: 4 }}>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>Total Recordings</Typography>
          <Typography variant="h4">{stats.totalRecordings}</Typography>
          <Typography variant="body2" color="success.main">
            +{stats.recordingsToday} today
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>Total Users</Typography>
          <Typography variant="h4">{stats.totalUsers}</Typography>
          <Typography variant="body2" color="text.secondary">
            Contributors
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>Pending Review</Typography>
          <Typography variant="h4" color="warning.main">{stats.pendingRecordings}</Typography>
          <Typography variant="body2" color="text.secondary">
            Need attention
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>Storage Used</Typography>
          <Typography variant="h4">{formatFileSize(stats.storageUsed)}</Typography>
          <Typography variant="body2" color="text.secondary">
            Total size
          </Typography>
        </CardContent>
      </Card>
    </Grid>

    {/* Status Breakdown */}
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Status Breakdown</Typography>
          {stats.statusBreakdown.map((item) => (
            <Box key={item.status} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{item.status}</Typography>
                <Typography variant="body2">{item.count} ({item.percentage}%)</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={item.percentage} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>

    {/* Method Breakdown */}
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recording Methods</Typography>
          {stats.methodBreakdown.map((item) => (
            <Box key={item.method} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{item.method}</Typography>
                <Typography variant="body2">{item.count} ({item.percentage}%)</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={item.percentage} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>

    {/* Top Contributors */}
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Top Contributors</Typography>
          <Grid container spacing={2}>
            {stats.topContributors.slice(0, 5).map((contributor, index) => (
              <Grid item xs={12} sm={6} md={4} key={contributor.userId}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    #{index + 1} {contributor.userName || 'Anonymous'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {contributor.userEmail}
                  </Typography>
                  <Typography variant="body2">
                    {contributor.recordingCount} recordings
                  </Typography>
                  <Typography variant="body2">
                    {formatDuration(contributor.totalDuration)} total
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);