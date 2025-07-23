// types/manage.ts
export interface Recording {
  id: string
  filename: string
  originalName: string
  fileSize: number
  duration: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  method: 'LIVE' | 'UPLOAD'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  nameList: {
    id: string
    title: string
  }
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: {
    recordings: number
  }
}

export interface ProjectStats {
  totalRecordings: number
  pendingRecordings: number
  approvedRecordings: number
  rejectedRecordings: number
  totalUsers: number
  totalNameLists: number
  totalDuration: number
  totalFileSize: number
}

export interface NewUserData {
  name: string
  email: string
  password: string
  role: string
}