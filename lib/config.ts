// Application Configuration
export const CONFIG = {
  // File Upload Limits
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  
  // Audio Settings - remove 'as const' to allow string comparison
  SUPPORTED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/wav', 
    'audio/x-wav',
    'audio/wave',
    'audio/mp4', 
    'audio/webm', 
    'audio/ogg',
    'audio/x-m4a',
    'audio/m4a',
    'audio/aac',
    'audio/mp3'
  ],
  
  // Recording Settings
  DEFAULT_RECORDING_QUALITY: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  
  // Timeouts
  UPLOAD_TIMEOUT_MS: 30 * 1000, // 30 seconds
  
  // UI Settings
  NAMES_PER_PAGE: 5,
  
  // Database Settings
TEMP_NAME_LIST_ID: 'cmbjko3l80001snlby2twdzj2',  // Make sure this is a valid ID format
  
  // PDF Settings
  PDF_MARGIN: 20,
  PDF_LINE_HEIGHT: 8,
  PDF_PAGE_HEIGHT: 270,
  
  // Exhibition Settings
  DEFAULT_PAUSE_BETWEEN_RECORDINGS_SECONDS: 2,
  TARGET_LOUDNESS_LUFS: -23.0,
  
  // Pagination
  RECORDINGS_PER_PAGE: 20,
  
  // Notification Settings
  DEFAULT_REMINDER_FREQUENCY_DAYS: 7,
  MAX_RETRY_ATTEMPTS: 3,
} // Removed 'as const'

// Helper functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isValidAudioType = (mimeType: string): boolean => {
  return CONFIG.SUPPORTED_AUDIO_TYPES.includes(mimeType)
}

export const isFileSizeValid = (fileSize: number): boolean => {
  return fileSize <= CONFIG.MAX_FILE_SIZE_BYTES
}