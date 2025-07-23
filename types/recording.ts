export interface Recording {
  id: string;
  fileName: string;
  title: string;
  filePath: string;
  fileSize: number;
  duration: number | null;
  mimeType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';
  recordingMethod: 'LIVE' | 'UPLOAD';
  createdAt: string;
  updatedAt: string;
  nameList: {
    id: string;
    title: string;
    pageNumber: number;
  } | null;
  notes: string | null;
  exhibitionOrder: number | null;
}

export interface RecordingStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalDuration: number;
  avgDuration: number;
}