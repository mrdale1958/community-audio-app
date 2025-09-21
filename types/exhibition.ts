export interface Exhibition {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  galleryHours: string;
  psaFrequency: number;
  settings: string | null;
  galleristId: string;
  gallerist?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    queue: number;
    psaFiles: number;
    playbackLogs: number;
  };
  createdAt: string;
  updatedAt: string;
}