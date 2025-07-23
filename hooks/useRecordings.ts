import { useState, useEffect } from 'react';
import { Recording, RecordingStats } from '@/types/recording';

export const useRecordings = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [stats, setStats] = useState<RecordingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = async () => {
    try {
      const response = await fetch('/api/recordings');
      if (response.ok) {
        const data = await response.json();
        setRecordings(data.recordings || data);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/recordings/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setRecordings(prev => prev.filter(r => r.id !== id));
        fetchStats(); // Refresh stats
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete recording:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchRecordings();
    fetchStats();
  }, []);

  return {
    recordings,
    stats,
    loading,
    deleteRecording,
    refetch: () => {
      fetchRecordings();
      fetchStats();
    },
  };
};