// lib/config.ts - Enhanced configuration with page-based settings

// Define supported audio types separately for better type handling
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/m4a',
  'audio/mp3',
  'audio/webm',
  'audio/ogg'
] as const;

export const CONFIG = {
  // Page Configuration
  PAGE: {
    NAMES_PER_PAGE: 50, // Number of names per page/list
    DEFAULT_START_PAGE: 1, // Starting page number
    MAX_PAGES: 100, // Maximum number of pages allowed
    PAGE_NUMBER_PREFIX: 'Page', // Prefix for page display (e.g., "Page 1")
  },

  // File Upload Configuration
  UPLOAD: {
    MAX_SIZE_MB: 50,
    MAX_SIZE_BYTES: 50 * 1024 * 1024,
    SUPPORTED_TYPES: SUPPORTED_AUDIO_TYPES,
    UPLOAD_DIR: './uploads',
    TEMP_DIR: './uploads/temp',
  },

  // Recording Configuration
  RECORDING: {
    MIN_DURATION_SECONDS: 10,
    MAX_DURATION_SECONDS: 600, // 10 minutes
    MIN_DURATION_PER_NAME: 2, // seconds per name
    MAX_DURATION_PER_NAME: 5, // seconds per name
    SAMPLE_RATE: 44100,
    BIT_DEPTH: 16,
    CHANNELS: 1, // Mono
    FORMAT: 'webm',
  },

  // Exhibition Configuration
  EXHIBITION: {
    TARGET_RECORDINGS: 5000,
    QUEUE_SIZE: 100,
    PLAYBACK_FADE_DURATION: 2000, // milliseconds
    AUTO_ADVANCE: true,
    SHUFFLE_MODE: false,
  },

  // Database Configuration
  DATABASE: {
    PAGINATION_LIMIT: 20,
    MAX_QUERY_TIMEOUT: 30000,
    CONNECTION_RETRY_ATTEMPTS: 3,
  },

  // Authentication Configuration
  AUTH: {
    SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days
    PASSWORD_MIN_LENGTH: 8,
    RATE_LIMIT_ATTEMPTS: 5,
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  },

  // PDF Generation Configuration
  PDF: {
    PAGE_SIZE: 'a4' as const,
    MARGIN: 20,
    FONT_SIZE: 12,
    LINE_HEIGHT: 1.5,
    HEADER_HEIGHT: 30,
    FOOTER_HEIGHT: 20,
    NAMES_PER_COLUMN: 2,
  },

  // UI Configuration
  UI: {
    THEME_MODE: 'light' as const,
    HEADER_HEIGHT: 64,
    SIDEBAR_WIDTH: 280,
    MOBILE_BREAKPOINT: 768,
    TOAST_DURATION: 5000,
  },
} as const;

// Helper functions for page-based operations
export const PageHelpers = {
  /**
   * Generate page number from array index
   */
  getPageNumber: (index: number): number => {
    return index + CONFIG.PAGE.DEFAULT_START_PAGE;
  },

  /**
   * Generate page title with number
   */
  getPageTitle: (pageNumber: number): string => {
    return `${CONFIG.PAGE.PAGE_NUMBER_PREFIX} ${pageNumber}`;
  },

  /**
   * Calculate total pages needed for given number of names
   */
  calculateTotalPages: (totalNames: number): number => {
    return Math.ceil(totalNames / CONFIG.PAGE.NAMES_PER_PAGE);
  },

  /**
   * Get names for a specific page from a larger array
   */
  getNamesForPage: (allNames: string[], pageNumber: number): string[] => {
    const startIndex = (pageNumber - CONFIG.PAGE.DEFAULT_START_PAGE) * CONFIG.PAGE.NAMES_PER_PAGE;
    const endIndex = startIndex + CONFIG.PAGE.NAMES_PER_PAGE;
    return allNames.slice(startIndex, endIndex);
  },

  /**
   * Validate page number
   */
  isValidPageNumber: (pageNumber: number): boolean => {
    return pageNumber >= CONFIG.PAGE.DEFAULT_START_PAGE && 
           pageNumber <= CONFIG.PAGE.MAX_PAGES;
  },

  /**
   * Generate page range for pagination
   */
  getPageRange: (currentPage: number, totalPages: number, maxVisible: number = 5): number[] => {
    const start = Math.max(CONFIG.PAGE.DEFAULT_START_PAGE, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  },

  /**
   * Format page display text
   */
  formatPageDisplay: (pageNumber: number, totalPages?: number): string => {
    const base = PageHelpers.getPageTitle(pageNumber);
    return totalPages ? `${base} of ${totalPages}` : base;
  },
};

// Validation helpers
export const ValidationHelpers = {
  /**
   * Validate file size
   */
  isValidFileSize: (sizeBytes: number): boolean => {
    return sizeBytes <= CONFIG.UPLOAD.MAX_SIZE_BYTES && sizeBytes > 0;
  },

  /**
   * Validate audio file type
   */
  isValidAudioType: (mimeType: string): boolean => {
    return CONFIG.UPLOAD.SUPPORTED_TYPES.includes(mimeType as any);
  },

  /**
   * Validate recording duration
   */
  isValidDuration: (durationSeconds: number): boolean => {
    return durationSeconds >= CONFIG.RECORDING.MIN_DURATION_SECONDS && 
           durationSeconds <= CONFIG.RECORDING.MAX_DURATION_SECONDS;
  },

  /**
   * Validate names array for a page
   */
  isValidNamesPage: (names: string[]): boolean => {
    return names.length > 0 && names.length <= CONFIG.PAGE.NAMES_PER_PAGE;
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Format duration for display
   */
  formatDuration: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
};

// Type exports for better TypeScript support
export type ConfigKeys = keyof typeof CONFIG;
export type PageConfig = typeof CONFIG.PAGE;
export type UploadConfig = typeof CONFIG.UPLOAD;
export type RecordingConfig = typeof CONFIG.RECORDING;
export type SupportedAudioType = typeof SUPPORTED_AUDIO_TYPES[number];

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';

  return {
    ...CONFIG,
    // Override settings based on environment
    DATABASE: {
      ...CONFIG.DATABASE,
      PAGINATION_LIMIT: isDev ? 10 : CONFIG.DATABASE.PAGINATION_LIMIT,
    },
    UPLOAD: {
      ...CONFIG.UPLOAD,
      MAX_SIZE_MB: isDev ? 10 : CONFIG.UPLOAD.MAX_SIZE_MB,
      MAX_SIZE_BYTES: isDev ? 10 * 1024 * 1024 : CONFIG.UPLOAD.MAX_SIZE_BYTES,
    },
  };
};