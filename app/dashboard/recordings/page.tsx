// app/dashboard/recordings/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Container, Typography, Grid, LinearProgress } from '@mui/material';
import { useRecordings } from '@/hooks/useRecordings';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Recording } from '@/types/recording';

// Component imports
import { RecordingStatsCards } from '@/components/recordings/RecordingStatsCards';
import { RecordingFilters } from '@/components/recordings/RecordingFilters';
import { RecordingCard } from '@/components/recordings/RecordingCard';
import { RecordingDetailsDialog } from '@/components/recordings/RecordingDetailsDialog';
import { DeleteConfirmDialog } from '@/components/recordings/DeleteConfirmDialog';
import { EmptyState } from '@/components/recordings/EmptyState';

const RecordingManagementDashboard = () => {
  // Data hooks
  const { recordings, stats, loading, deleteRecording } = useRecordings();
  const { playingId, playPause, isPlaying } = useAudioPlayer();
  
  // UI state
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Filtered recordings with null checks
  // In your main dashboard component, update the filteredRecordings useMemo:
const filteredRecordings = useMemo(() => {
  if (!recordings || !Array.isArray(recordings)) {
    console.log('Recordings is not an array:', recordings);
    return [];
  }

  return recordings.filter(recording => {
    if (!recording || typeof recording !== 'object') {
      console.log('Invalid recording object:', recording);
      return false;
    }

    // Fix: Use 'title' instead of 'originalName' since that's what your data has
    if (!recording.title || typeof recording.title !== 'string') {
      console.log('Recording missing title:', recording);
      return false;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = recording.title.toLowerCase().includes(searchLower) ||
                         (recording.nameList?.title?.toLowerCase().includes(searchLower) || false);
    const matchesStatus = statusFilter === 'ALL' || recording.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || recording.recordingMethod === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });
}, [recordings, searchTerm, statusFilter, methodFilter]);

  // Event handlers
  const handleDeleteConfirm = async () => {
    if (recordingToDelete) {
      const success = await deleteRecording(recordingToDelete.id);
      if (success) {
        setRecordingToDelete(null);
      }
    }
  };

  // Debug logging
  console.log('Recordings data:', recordings);
  console.log('Stats data:', stats);
  console.log('Loading:', loading);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading your recordings...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Recordings
      </Typography>

      {/* Debug info - remove this later */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Debug: Found {recordings?.length || 0} recordings, filtered to {filteredRecordings.length}
      </Typography>

      {/* Stats Overview */}
      {stats && <RecordingStatsCards stats={stats} />}

      {/* Filters */}
      <RecordingFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        totalRecordings={recordings?.length || 0}
        filteredCount={filteredRecordings.length}
      />

      {/* Recordings Grid */}
      {filteredRecordings.length === 0 ? (
        <EmptyState hasRecordings={(recordings?.length || 0) > 0} />
      ) : (
        <Grid container spacing={3}>
          {filteredRecordings.map((recording) => (
            <Grid item xs={12} md={6} lg={4} key={recording.id}>
              <RecordingCard
                recording={recording}
                isPlaying={isPlaying(recording.id)}
                onPlayPause={() => playPause(recording.id)}
                onViewDetails={() => setSelectedRecording(recording)}
                onDelete={() => setRecordingToDelete(recording)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogs */}
      <RecordingDetailsDialog
        recording={selectedRecording}
        open={!!selectedRecording}
        onClose={() => setSelectedRecording(null)}
      />

      <DeleteConfirmDialog
        recording={recordingToDelete}
        open={!!recordingToDelete}
        onClose={() => setRecordingToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </Container>
  );
};

export default RecordingManagementDashboard;