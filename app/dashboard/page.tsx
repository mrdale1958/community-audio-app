// app/dashboard/page.tsx - Updated with dynamic progress calculation

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Mic,
  Upload,
  BarChart,
  Person,
  Assignment,
} from '@mui/icons-material';

interface DashboardStats {
  totalNames: number;
  totalRecordings: number;
  approvedRecordings: number;
  pagesWithRecordings: number;
  totalPages: number;
  completionPercentage: number;
  remainingNames: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        
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

    if (status === 'authenticated') {
      fetchStats();
      
      // Refresh stats every 2 minutes
      const interval = setInterval(fetchStats, 120000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const userRole = session?.user?.role || 'CONTRIBUTOR';

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {session?.user?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {userRole === 'CONTRIBUTOR' && 'Ready to contribute to the Call My Name Project?'}
          {userRole === 'MANAGER' && 'Review recordings and manage project progress.'}
          {userRole === 'ADMIN' && 'Full system access - manage users and project settings.'}
          {userRole === 'OBSERVER' && 'Monitor project progress and statistics.'}
        </Typography>
      </Box>

      {/* Project Progress Card */}
      {loading ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Loading project statistics...</Typography>
            </Box>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : stats ? (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Call My Name Project Progress
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {stats.approvedRecordings.toLocaleString()} of {stats.totalNames.toLocaleString()} names recorded
                </Typography>
                <Typography variant="body2">
                  {stats.completionPercentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.completionPercentage}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'rgba(255,255,255,0.8)'
                  }
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6">{stats.totalNames.toLocaleString()}</Typography>
                  <Typography variant="caption">Total Names</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6">{stats.approvedRecordings.toLocaleString()}</Typography>
                  <Typography variant="caption">Recorded</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6">{stats.totalPages.toLocaleString()}</Typography>
                  <Typography variant="caption">Total Pages</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6">{stats.remainingNames.toLocaleString()}</Typography>
                  <Typography variant="caption">Remaining</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* Action Cards */}
      <Grid container spacing={3}>
        {/* Recording Actions - All users can contribute */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Mic sx={{ mr: 1 }} />
                Record Names
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Contribute to the Call My Name Project by recording names live through your browser.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/contribute/live')}
                sx={{ mr: 1, mb: 1 }}
              >
                Start Recording
              </Button>
              {stats && stats.remainingNames > 0 && (
                <Chip 
                  label={`${stats.remainingNames.toLocaleString()} names remaining`}
                  size="small"
                  color="info"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Upload sx={{ mr: 1 }} />
                Upload Recordings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload recordings you've made offline using downloaded name lists.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => router.push('/contribute/offline')}
              >
                Upload Files
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Manager/Admin Actions */}
        {['MANAGER', 'ADMIN'].includes(userRole) && (
          <>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assignment sx={{ mr: 1 }} />
                    Review Recordings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Review submitted recordings and manage approval status.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/admin/recordings')}
                  >
                    Review Queue
                  </Button>
                  {stats && stats.totalRecordings > stats.approvedRecordings && (
                    <Chip 
                      label={`${stats.totalRecordings - stats.approvedRecordings} pending`}
                      size="small"
                      color="warning"
                      sx={{ ml: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BarChart sx={{ mr: 1 }} />
                    Project Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    View detailed project statistics and progress reports.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/admin/analytics')}
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Admin-only Actions */}
        {userRole === 'ADMIN' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1 }} />
                  User Management
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Manage user accounts, roles, and permissions.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/users')}
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Public Progress Link */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Share Project Progress
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View the public progress page that shows the Call My Name Project's current status.
              </Typography>
              <Button
                variant="text"
                onClick={() => router.push('/observe')}
                sx={{ mr: 1 }}
              >
                View Public Progress
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  const url = `${window.location.origin}/observe`;
                  navigator.clipboard.writeText(url);
                  // Could add a toast notification here
                }}
              >
                Copy Link
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats Footer */}
      {stats && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()} • 
            {stats.totalPages} pages • {stats.pagesWithRecordings} with recordings
          </Typography>
        </Box>
      )}
    </Box>
  );
}