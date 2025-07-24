// Centralized configuration for the Read My Name project

export const CONFIG = {
  // File upload settings
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB in bytes
  SUPPORTED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp3',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm'
  ] as string[],
  UPLOAD_DIRECTORY: './uploads',
  PSA_DIRECTORY: './uploads/psa',

  // Recording settings
  RECORDING_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_RECORDING_DURATION: 20 * 60, // 20 minutes in seconds
  SAMPLE_RATE: 44100,
  
  // Page management settings
  PAGE: {
    DEFAULT_START_PAGE: 1,
    MAX_PAGES_PER_SERIES: 10000,
    MAX_PAGES: 10000,
    NAMES_PER_PAGE: 50,
    DEFAULT_NAMES_PER_PAGE: 50
  },
  
  // Exhibition settings
  DEFAULT_PSA_FREQUENCY: 50, // Insert PSA every N recordings
  MIN_PSA_FREQUENCY: 10,
  MAX_PSA_FREQUENCY: 200,
  PLAYBACK_BUFFER_SIZE: 5, // Number of recordings to preload
  MAX_CONSECUTIVE_SAME_CONTRIBUTOR: 1, // Never allow more than 1 consecutive
  FADE_DURATION: 2, // seconds for crossfade
  SILENCE_BETWEEN_RECORDINGS: 1, // seconds
  MAX_PLAYBACK_ATTEMPTS: 3,
  
  // Gallery hours defaults
  DEFAULT_GALLERY_HOURS: [
    { day: 0, open: "12:00", close: "17:00" }, // Sunday
    { day: 1, open: "10:00", close: "18:00" }, // Monday
    { day: 2, open: "10:00", close: "18:00" }, // Tuesday
    { day: 3, open: "10:00", close: "18:00" }, // Wednesday
    { day: 4, open: "10:00", close: "18:00" }, // Thursday
    { day: 5, open: "10:00", close: "18:00" }, // Friday
    { day: 6, open: "10:00", close: "17:00" }  // Saturday
  ],

  // Database settings
  PAGINATION_SIZE: 20,
  MAX_PAGINATION_SIZE: 100,

  // Quality assurance
  HASH_ALGORITHM: 'sha256',
  QA_BATCH_SIZE: 10, // Process this many files at once
  CORRUPTION_CHECK_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

  // API timeouts
  API_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 300000, // 5 minutes for large files

  // Exhibition statistics
  STATS_UPDATE_INTERVAL: 60000, // 1 minute
  LOG_RETENTION_DAYS: 90,

  // Audio processing
  AUDIO_ANALYSIS_TIMEOUT: 60000, // 1 minute per file
  MIN_AUDIO_DURATION: 10, // seconds
  MAX_AUDIO_DURATION: 3600, // 1 hour

} as const;

// Helper functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function isValidAudioType(mimeType: string): boolean {
  return CONFIG.SUPPORTED_AUDIO_TYPES.includes(mimeType);
}

export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= CONFIG.MAX_FILE_SIZE;
}

export function calculateExhibitionDuration(startDate: Date, endDate: Date, galleryHours: Array<{day: number, open: string, close: string}>): number {
  let totalMinutes = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dayHours = galleryHours.find(gh => gh.day === dayOfWeek);
    
    if (dayHours) {
      const [openHour, openMin] = dayHours.open.split(':').map(Number);
      const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
      
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      totalMinutes += closeMinutes - openMinutes;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return totalMinutes;
}

export function isGalleryOpen(date: Date, galleryHours: Array<{day: number, open: string, close: string}>): boolean {
  const dayOfWeek = date.getDay();
  const timeString = date.toTimeString().slice(0, 5); // "HH:MM" format
  
  const dayHours = galleryHours.find(gh => gh.day === dayOfWeek);
  if (!dayHours) return false;
  
  return timeString >= dayHours.open && timeString <= dayHours.close;
}