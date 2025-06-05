// Type definitions for Prisma string enums (SQLite compatibility)

export type UserRole = "CONTRIBUTOR" | "MANAGER" | "OBSERVER" | "ADMIN"

export type RecordingMethod = "LIVE_BROWSER" | "OFFLINE_UPLOAD"

export type RecordingQuality = "LOW" | "MEDIUM" | "HIGH" | "LOSSLESS"

export type RecordingStatus = 
  | "UPLOADED" 
  | "PROCESSING" 
  | "PROCESSED" 
  | "APPROVED" 
  | "REJECTED" 
  | "QUEUED_FOR_EXHIBITION"

export type NotificationType = 
  | "WELCOME" 
  | "REMINDER" 
  | "ASSIGNMENT" 
  | "DEADLINE" 
  | "SYSTEM_UPDATE"

export type NotificationMethod = "EMAIL" | "SMS"

export type NotificationStatus = 
  | "PENDING" 
  | "SENT" 
  | "DELIVERED" 
  | "FAILED" 
  | "CANCELLED"

// Utility functions for working with JSON fields
export const parseNameList = (names: string): string[] => {
  try {
    return JSON.parse(names) as string[]
  } catch {
    return []
  }
}

export const stringifyNameList = (names: string[]): string => {
  return JSON.stringify(names)
}

export const parseAllowedFileTypes = (types: string): string[] => {
  try {
    return JSON.parse(types) as string[]
  } catch {
    return ["mp3", "wav", "m4a"]
  }
}

export const stringifyAllowedFileTypes = (types: string[]): string => {
  return JSON.stringify(types)
}

// Type guards for enum validation
export const isValidUserRole = (role: string): role is UserRole => {
  return ["CONTRIBUTOR", "MANAGER", "OBSERVER", "ADMIN"].includes(role)
}

export const isValidRecordingMethod = (method: string): method is RecordingMethod => {
  return ["LIVE_BROWSER", "OFFLINE_UPLOAD"].includes(method)
}

export const isValidRecordingStatus = (status: string): status is RecordingStatus => {
  return [
    "UPLOADED", 
    "PROCESSING", 
    "PROCESSED", 
    "APPROVED", 
    "REJECTED", 
    "QUEUED_FOR_EXHIBITION"
  ].includes(status)
}

export const isValidNotificationType = (type: string): type is NotificationType => {
  return [
    "WELCOME", 
    "REMINDER", 
    "ASSIGNMENT", 
    "DEADLINE", 
    "SYSTEM_UPDATE"
  ].includes(type)
}

export const isValidNotificationMethod = (method: string): method is NotificationMethod => {
  return ["EMAIL", "SMS"].includes(method)
}

export const isValidNotificationStatus = (status: string): status is NotificationStatus => {
  return [
    "PENDING", 
    "SENT", 
    "DELIVERED", 
    "FAILED", 
    "CANCELLED"
  ].includes(status)
}