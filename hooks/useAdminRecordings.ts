import { useState, useEffect } from 'react';
import { AdminRecording, AdminStats, BulkAction } from '@/types/admin';

export const useAdminRecordings = () => {
  const [recordings, setRecordings] = useState<AdminRecording[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);

  const fetchRecordings = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
      if (params?.method && params.method !== 'ALL') searchParams.set('method', params.method);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const response = await fetch(`/api/admin/recordings?${searchParams}`);
      if (response.ok) {
        const data = await response.json();
        setRecordings(data.recordings || data);
        return data;
      }
      throw new Error('Failed to fetch recordings');
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        return data;
      }
      throw new Error('Failed to fetch stats');
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  };

  const updateRecordingStatus = async (recordingId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/recordings/${recordingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      
      if (response.ok) {
        const updatedRecording = await response.json();
        setRecordings(prev => 
          prev.map(r => r.id === recordingId ? { ...r, ...updatedRecording } : r)
        );
        fetchStats(); // Refresh stats
        return updatedRecording;
      }
      throw new Error('Failed to update recording');
    } catch (error) {
      console.error('Failed to update recording:', error);
      throw error;
    }
  };

  const bulkAction = async (action: BulkAction) => {
    try {
      const response = await fetch('/api/admin/recordings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Refresh recordings and stats after bulk action
        await fetchRecordings();
        await fetchStats();
        setSelectedRecordings([]); // Clear selection
        return result;
      }
      throw new Error('Failed to perform bulk action');
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      throw error;
    }
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      const response = await fetch(`/api/admin/recordings/${recordingId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setRecordings(prev => prev.filter(r => r.id !== recordingId));
        fetchStats(); // Refresh stats
        return true;
      }
      throw new Error('Failed to delete recording');
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  };

  const toggleRecordingSelection = (recordingId: string) => {
    setSelectedRecordings(prev => 
      prev.includes(recordingId)
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]
    );
  };

  const selectAllRecordings = () => {
    setSelectedRecordings(recordings.map(r => r.id));
  };

  const clearSelection = () => {
    setSelectedRecordings([]);
  };

  useEffect(() => {
    fetchRecordings();
    fetchStats();
  }, []);

  return {
    recordings,
    stats,
    loading,
    selectedRecordings,
    fetchRecordings,
    fetchStats,
    updateRecordingStatus,
    bulkAction,
    deleteRecording,
    toggleRecordingSelection,
    selectAllRecordings,
    clearSelection,
    refetch: () => {
      fetchRecordings();
      fetchStats();
    },
  };
};