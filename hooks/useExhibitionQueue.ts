import { useState, useEffect } from 'react';
import { ExhibitionQueue } from '@/types/admin';

export const useExhibitionQueue = () => {
  const [queue, setQueue] = useState<ExhibitionQueue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/admin/exhibition-queue');
      if (response.ok) {
        const data = await response.json();
        setQueue(data);
      }
    } catch (error) {
      console.error('Failed to fetch exhibition queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = async (recordingId: string, position?: number) => {
    try {
      const response = await fetch('/api/admin/exhibition-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId, position }),
      });
      
      if (response.ok) {
        await fetchQueue(); // Refresh queue
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add to queue:', error);
      return false;
    }
  };

  const removeFromQueue = async (queueId: string) => {
    try {
      const response = await fetch(`/api/admin/exhibition-queue/${queueId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setQueue(prev => prev.filter(q => q.id !== queueId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove from queue:', error);
      return false;
    }
  };

  const reorderQueue = async (queueId: string, newPosition: number) => {
    try {
      const response = await fetch(`/api/admin/exhibition-queue/${queueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition }),
      });
      
      if (response.ok) {
        await fetchQueue(); // Refresh queue
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reorder queue:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return {
    queue,
    loading,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    refetch: fetchQueue,
  };
};