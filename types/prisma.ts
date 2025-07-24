// TypeScript types for string-based enums (SQLite limitation)

export const UserRole = {
  CONTRIBUTOR: 'CONTRIBUTOR',
  MANAGER: 'MANAGER', 
  OBSERVER: 'OBSERVER',
  ADMIN: 'ADMIN',
  GALLERIST: 'GALLERIST'
} as const;

export const RecordingStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED', 
  REJECTED: 'REJECTED'
} as const;

export const RecordingMethod = {
  LIVE: 'LIVE',
  UPLOAD: 'UPLOAD'
} as const;

export const PlaybackItemType = {
  RECORDING: 'RECORDING',
  PSA: 'PSA'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
export type RecordingStatus = typeof RecordingStatus[keyof typeof RecordingStatus];
export type RecordingMethod = typeof RecordingMethod[keyof typeof RecordingMethod];
export type PlaybackItemType = typeof PlaybackItemType[keyof typeof PlaybackItemType];

// Gallery hours interface for JSON storage
export interface GalleryHours {
  day: number; // 0 = Sunday, 1 = Monday, etc.
  open: string; // "09:00" format
  close: string; // "17:00" format
}

// Exhibition settings interface for JSON storage
export interface ExhibitionSettings {
  allowManualControl: boolean;
  fadeTransitions: boolean;
  fadeDuration: number; // seconds
  silenceBetweenRecordings: number; // seconds
  maxPlaybackAttempts: number;
  autoRestartOnError: boolean;
}

// Helper functions for validation
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export function isValidRecordingStatus(status: string): status is RecordingStatus {
  return Object.values(RecordingStatus).includes(status as RecordingStatus);
}

export function isValidRecordingMethod(method: string): method is RecordingMethod {
  return Object.values(RecordingMethod).includes(method as RecordingMethod);
}

export function isValidPlaybackItemType(type: string): type is PlaybackItemType {
  return Object.values(PlaybackItemType).includes(type as PlaybackItemType);
}