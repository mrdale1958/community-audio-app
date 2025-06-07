import { Recording } from './recording';

export interface AdminRecording extends Recording {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface AdminStats {
  totalRecordings: number;
  totalUsers: number;
  pendingRecordings: number;
  approvedRecordings: number;
  rejectedRecordings: number;
  processingRecordings: number;
  totalDuration: number;
  avgDuration: number;
  storageUsed: number;
  recordingsToday: number;
  recordingsThisWeek: number;
  recordingsThisMonth: number;
  topContributors: Array<{
    userId: string;
    userName: string | null;
    userEmail: string;
    recordingCount: number;
    totalDuration: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  methodBreakdown: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

export interface BulkAction {
  type: 'APPROVE' | 'REJECT' | 'DELETE' | 'SET_STATUS' | 'ADD_TO_QUEUE';
  recordingIds: string[];
  newStatus?: string;
  queuePosition?: number;
}

export interface ExhibitionQueue {
  id: string;
  recordingId: string;
  position: number;
  recording: AdminRecording;
  createdAt: string;
  updatedAt: string;
}