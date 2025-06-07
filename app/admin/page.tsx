'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Typography, Tabs, Tab, Box, Alert } from '@mui/material';
import { useAdminRecordings } from '@/hooks/useAdminRecordings';
import { useExhibitionQueue } from '@/hooks/useExhibitionQueue';
import { AdminStatsOverview } from '@/components/admin/AdminStatsOverview';
import { AdminRecordingsTab } from '@/components/admin/AdminRecordingsTab';
import { ExhibitionQueueTab } from '@/components/admin/ExhibitionQueueTab';
import { UserManagementTab } from '@/components/admin/UserManagementTab';

const AdminDashboard = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  
  const {
    recordings,
    stats,
    loading,
    selectedRecordings,
    fetchRecordings,
    updateRecordingStatus,
    bulkAction,
    deleteRecording,
    toggleRecordingSelection,
    selectAllRecordings,
    clearSelection,
  } = useAdminRecordings();

  const {
    queue,
    loading: queueLoading,
    addToQueue,
    removeFromQueue,
    reorderQueue,
  } = useExhibitionQueue();

  // Check if user has admin access
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MANAGER') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. You don't have permission to view the admin dashboard.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading admin dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Stats Overview */}
      {stats && <AdminStatsOverview stats={stats} />}

      {/* Main Content Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`All Recordings (${recordings.length})`} />
          <Tab label={`Exhibition Queue (${queue.length})`} />
          <Tab label="User Management" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <AdminRecordingsTab
          recordings={recordings}
          selectedRecordings={selectedRecordings}
          onToggleSelection={toggleRecordingSelection}
          onSelectAll={selectAllRecordings}
          onClearSelection={clearSelection}
          onStatusChange={updateRecordingStatus}
          onBulkAction={bulkAction}
          onDelete={deleteRecording}
          onAddToQueue={addToQueue}
        />
      )}

      {activeTab === 1 && (
        <ExhibitionQueueTab
          queue={queue}
          loading={queueLoading}
          onRemoveFromQueue={removeFromQueue}
          onReorderQueue={reorderQueue}
        />
      )}

      {activeTab === 2 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {activeTab === 2 && (
              <UserManagementTab />
            )}          </Typography>
        </Box>
      )}

      {activeTab === 3 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Analytics - Coming Soon
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default AdminDashboard;