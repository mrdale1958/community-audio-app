import { useState } from 'react';
import { Box } from '@mui/material';
import { AdminRecording, BulkAction } from '@/types/admin';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AdminFilters } from './AdminFilters';
import { BulkActionsBar } from './BulkActionsBar';
import { AdminRecordingTable } from './AdminRecordingTable';
import { AdminRecordingDetailsDialog } from './AdminRecordingDetailsDialog';

interface AdminRecordingsTabProps {
  recordings: AdminRecording[];
  selectedRecordings: string[];
  onToggleSelection: (recordingId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onStatusChange: (recordingId: string, status: string) => Promise<any>;
  onBulkAction: (action: BulkAction) => Promise<any>;
  onDelete: (recordingId: string) => Promise<boolean>;
  onAddToQueue: (recordingId: string) => Promise<boolean>;
}

export const AdminRecordingsTab = ({
  recordings,
  selectedRecordings,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onStatusChange,
  onBulkAction,
  onDelete,
  onAddToQueue,
}: AdminRecordingsTabProps) => {
  const { playingId, playPause } = useAudioPlayer();
  const [selectedRecording, setSelectedRecording] = useState<AdminRecording | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter recordings
  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (recording.nameList?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'ALL' || recording.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || recording.recordingMethod === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'userName':
        aValue = a.user.name || a.user.email;
        bValue = b.user.name || b.user.email;
        break;
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'duration':
        aValue = a.duration || 0;
        bValue = b.duration || 0;
        break;
      case 'fileSize':
        aValue = a.fileSize;
        bValue = b.fileSize;
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      default: // createdAt
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setMethodFilter('ALL');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleStatusChange = async (recordingId: string, status: string) => {
    try {
      await onStatusChange(recordingId, status);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (recordingId: string) => {
    try {
      await onDelete(recordingId);
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  const handleAddToQueue = async (recordingId: string) => {
    try {
      await onAddToQueue(recordingId);
    } catch (error) {
      console.error('Failed to add to queue:', error);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <AdminFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        totalRecordings={recordings.length}
        filteredCount={filteredRecordings.length}
        selectedCount={selectedRecordings.length}
        onClearFilters={handleClearFilters}
      />

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedRecordings.length}
        selectedRecordingIds={selectedRecordings}
        onBulkAction={onBulkAction}
        onClearSelection={onClearSelection}
      />

      {/* Recordings Table */}
      <AdminRecordingTable
        recordings={filteredRecordings}
        selectedRecordings={selectedRecordings}
        onToggleSelection={onToggleSelection}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        playingId={playingId}
        onPlayPause={playPause}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onViewDetails={setSelectedRecording}
        onAddToQueue={handleAddToQueue}
      />

      {/* Recording Details Dialog */}
      <AdminRecordingDetailsDialog
        recording={selectedRecording}
        open={!!selectedRecording}
        onClose={() => setSelectedRecording(null)}
        onStatusChange={handleStatusChange}
        onAddToQueue={handleAddToQueue}
      />
    </Box>
  );
};