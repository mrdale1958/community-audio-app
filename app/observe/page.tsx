// app/observe/page.tsx - Updated with dynamic target calculation

'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import { PlayArrow, Stop, VolumeUp } from '@mui/icons-material';

interface ObserveStats {
  totalNames: number;
  totalRecordings: number;
  approvedRecordings: number;
  pagesWithRecordings: number;
  totalPages: number;
  completionPercentage: number;
  remainingNames: number;
  pagesCompletionPercentage: number;
  averageRecordingsPerPage: number;
  pagesNeedingRecordings: number;
  recordingStatus: {
    pending: number;
    approved: number;
    rejected: number;
    archived: number;
  };
}

interface StatsApiResponse {
  success: boolean;
  data: ObserveStats;
  meta: {
    lastUpdated: string;
    targetAchieved: boolean;
  };
  error?: string;
}

export default function ObservePage() {
  const [stats, setStats] = useState<ObserveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch statistics from the database
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Fetch page statistics to get total names count
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json() as StatsApiResponse;
        
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error || 'Failed to load statistics');
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Call My Name Project Progress
        </Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Call My Name Project Progress
        </Typography>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Call My Name Project Progress
        </Typography>
        <Alert severity="info">
          No statistics available. Please check that the database is set up correctly.
        </Alert>
      </Box>
    );
  }

  const progressPercentage = stats.totalNames > 0 
    ? (stats.approvedRecordings / stats.totalNames) * 100 
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Call My Name Project Progress
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This community effort aims to record every name memorialized on the AIDS Memorial Quilt, 
        to be played back over the course of installations of the show Narrative Threads.
      </Typography>

      {/* Main Progress Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Overall Progress
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              {stats.approvedRecordings.toLocaleString()} of {stats.totalNames.toLocaleString()} names recorded
            </Typography>
            <Typography variant="body2" color="primary">
              {progressPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {stats.totalNames.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Names
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {stats.approvedRecordings.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recorded
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {stats.totalPages.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Pages
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {(stats.totalNames - stats.approvedRecordings).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Detail Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recording Status
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">
                    Pages with Recordings
                  </Typography>
                  <Chip 
                    label={`${stats.pagesWithRecordings} / ${stats.totalPages}`}
                    color="primary"
                    size="small"
                  />
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalPages > 0 ? (stats.pagesWithRecordings / stats.totalPages) * 100 : 0}
                  color="primary"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Total Recordings: {stats.totalRecordings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Recordings: {stats.approvedRecordings.toLocaleString()}
              </Typography>
              
              {stats.totalRecordings > stats.approvedRecordings && (
                <Typography variant="body2" color="warning.main">
                  Pending Review: {(stats.totalRecordings - stats.approvedRecordings).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How You Can Help
              </Typography>
              
              <Typography variant="body2" paragraph>
                Join our community effort to honor every name by contributing recordings:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PlayArrow sx={{ mr: 1, fontSize: 18 }} />
                  Record names live through your browser
                </Typography>
                
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VolumeUp sx={{ mr: 1, fontSize: 18 }} />
                  Download pages for offline recording
                </Typography>
                
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stop sx={{ mr: 1, fontSize: 18 }} />
                  Upload your completed recordings
                </Typography>
              </Box>

              {stats.totalNames > stats.approvedRecordings && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  We still need {(stats.totalNames - stats.approvedRecordings).toLocaleString()} more names recorded to complete the Call My Name project.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Every name recorded helps preserve memories and honor lives. Thank you for contributing to this important project.
        </Typography>
      </Box>
    </Box>
  );
}