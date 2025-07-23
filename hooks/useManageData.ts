// hooks/useManageData.ts
import { useState, useCallback } from 'react'
import type { Recording, User, ProjectStats, NewUserData } from '../types/manage'

export function useManageData() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Load data functions
  const loadRecordings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/recordings')
      if (!response.ok) throw new Error('Failed to load recordings')
      
      const data = await response.json()
      setRecordings(Array.isArray(data) ? data : data.recordings || [])
    } catch (err) {
      setError('Failed to load recordings')
      console.error('Error loading recordings:', err)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to load users')
      
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch (err) {
      setError('Failed to load users')
      console.error('Error loading users:', err)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to load stats')
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load statistics')
      console.error('Error loading stats:', err)
    }
  }, [])

  const loadAllData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([loadRecordings(), loadUsers(), loadStats()])
    setIsLoading(false)
  }, [loadRecordings, loadUsers, loadStats])

  // Recording management
  const updateRecordingStatus = useCallback(async (recordingId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/admin/recordings/${recordingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update recording')
      
      setRecordings(prev => 
        prev.map(r => r.id === recordingId ? { ...r, status } : r)
      )
      
      // Refresh stats
      loadStats()
    } catch (err) {
      setError('Failed to update recording status')
      console.error('Error updating recording:', err)
    }
  }, [loadStats])

  const deleteRecording = useCallback(async (recordingId: string) => {
    try {
      const response = await fetch(`/api/admin/recordings/${recordingId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete recording')
      
      setRecordings(prev => prev.filter(r => r.id !== recordingId))
      
      // Refresh stats
      loadStats()
    } catch (err) {
      setError('Failed to delete recording')
      console.error('Error deleting recording:', err)
    }
  }, [loadStats])

  // User management
  const updateUserRole = useCallback(async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      
      if (!response.ok) throw new Error('Failed to update user role')
      
      setUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, role } : u)
      )
    } catch (err) {
      setError('Failed to update user role')
      console.error('Error updating user:', err)
    }
  }, [])

  const addUser = useCallback(async (userData: NewUserData) => {
    try {
      // Basic client-side validation
      if (!userData.name.trim()) throw new Error('Name is required')
      if (!userData.email.trim()) throw new Error('Email is required')
      if (!userData.password || userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userData.email)) {
        throw new Error('Please enter a valid email address')
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.details && Array.isArray(errorData.details)) {
          throw new Error(errorData.details.join(', '))
        }
        
        throw new Error(errorData.error || 'Failed to create user')
      }
      
      const result = await response.json()
      setUsers(prev => [result.user, ...prev])
      
      loadStats()
      return result.user
    } catch (err) {
      // Don't set the main page error - let the dialog handle it
      throw err
    }
  }, [loadStats])

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete user')
      
      setUsers(prev => prev.filter(u => u.id !== userId))
      
      loadStats()
      loadRecordings()
    } catch (err) {
      setError('Failed to delete user')
      console.error('Error deleting user:', err)
    }
  }, [loadStats, loadRecordings])

  return {
    recordings,
    users,
    setUsers,
    stats,
    isLoading,
    error,
    setError,
    loadAllData,
    loadStats,
    updateRecordingStatus,
    deleteRecording,
    updateUserRole,
    deleteUser
  }
}