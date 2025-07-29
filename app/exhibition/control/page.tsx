// app/exhibition/control/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole, canControlExhibitions } from '@/types/prisma';
import GalleryAudioControl from '@/components/gallery/GalleryAudioControl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CheckCircle, Queue, Schedule } from '@mui/icons-material';

export default async function ExhibitionControlPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userRole = session.user.role as UserRole;
  
  if (!canControlExhibitions(userRole)) {
    redirect('/dashboard');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Exhibition Control Center
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Manage live gallery audio playback and sound systems
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Logged in as:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {session.user.name}
              </Typography>
              <Chip label={userRole} color="primary" size="small" />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        {/* Quick Status Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircle color="success" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Exhibition Status
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      Live & Active
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Queue color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Queue Position
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      247 / 1,847
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Schedule color="secondary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Runtime Today
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      6h 23m
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gallery Audio Control */}
        <GalleryAudioControl />

        {/* Additional sections can go here */}
      </Box>
    </Box>
  );
}