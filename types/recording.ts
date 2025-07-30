export interface Recording {
  id: string;
  filename: string;
  title: string;
  filePath: string;
  filesize: number;
  duration: number | null;
  mimetype: string;
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