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
  nameListId: string // Synthetic page ID
  // Optionally, add displayTitle if you need it for UI:
  // displayTitle?: string

  /*nameList: {
    id: string;
    title: string;
    pageNumber: number;
  } | null;*/
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