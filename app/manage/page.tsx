'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  LinearProgress
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  CheckCircle,
  Cancel,
  Delete,
  Info,
  People,
  QueueMusic,
  Analytics,
  Settings,
  Refresh,
  PersonAdd,
  Edit,
  Visibility,
  Mic,
  Upload
} from '@mui/icons-material'

interface Recording {
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

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: {
    recordings: number
  }
}

interface ProjectStats {
  totalRecordings: number
  pendingRecordings: number
  approvedRecordings: number
  rejectedRecordings: number
  totalUsers: number
  totalNameLists: number
  totalDuration: number
  totalFileSize: number
}

export default function ManagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [currentTab, setCurrentTab] = useState(0)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Pagination
  const [recordingsPage, setRecordingsPage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Audio player
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  
  // Dialog states
  const [showRecordingDialog, setShowRecordingDialog] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Add user form state
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CONTRIBUTOR'
  })
  const [addUserError, setAddUserError] = useState('')

  // Check admin access
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  // Load data functions
  const loadRecordings = async () => {
    try {
      const response = await fetch('/api/admin/recordings')
      if (!response.ok) throw new Error('Failed to load recordings')
      
      const data = await response.json()
      setRecordings(Array.isArray(data) ? data : data.recordings || [])
    } catch (err) {
      setError('Failed to load recordings')
      console.error('Error loading recordings:', err)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to load users')
      
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch (err) {
      setError('Failed to load users')
      console.error('Error loading users:', err)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to load stats')
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load statistics')
      console.error('Error loading stats:', err)
    }
  }

  const loadAllData = async () => {
    setIsLoading(true)
    await Promise.all([loadRecordings(), loadUsers(), loadStats()])
    setIsLoading(false)
  }

  // Recording management
  const updateRecordingStatus = async (recordingId: string, status: 'APPROVED' | 'REJECTED') => {
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
      
      setSuccessMessage(`Recording ${status.toLowerCase()}`)
      setShowSuccessMessage(true)
      
      // Refresh stats
      loadStats()
    } catch (err) {
      setError('Failed to update recording status')
      console.error('Error updating recording:', err)
    }
  }

  const deleteRecording = async (recordingId: string) => {
    try {
      const response = await fetch(`/api/admin/recordings/${recordingId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete recording')
      
      setRecordings(prev => prev.filter(r => r.id !== recordingId))
      setShowRecordingDialog(false)
      
      setSuccessMessage('Recording deleted')
      setShowSuccessMessage(true)
      
      // Refresh stats
      loadStats()
    } catch (err) {
      setError('Failed to delete recording')
      console.error('Error deleting recording:', err)
    }
  }

  // User management
  const updateUserRole = async (userId: string, role: string) => {
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
      
      setSuccessMessage(`User role updated to ${role}`)
      setShowSuccessMessage(true)
    } catch (err) {
      setError('Failed to update user role')
      console.error('Error updating user:', err)
    }
  }

  // Add new user
  const addUser = async () => {
    setAddUserError('')
    
    try {
      // Basic client-side validation
      if (!newUserData.name.trim()) {
        setAddUserError('Name is required')
        return
      }
      if (!newUserData.email.trim()) {
        setAddUserError('Email is required')
        return
      }
      if (!newUserData.password || newUserData.password.length < 6) {
        setAddUserError('Password must be at least 6 characters')
        return
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUserData.email)) {
        setAddUserError('Please enter a valid email address')
        return
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.details && Array.isArray(errorData.details)) {
          setAddUserError(errorData.details.join(', '))
          return
        }
        
        setAddUserError(errorData.error || 'Failed to create user')
        return
      }
      
      const result = await response.json()
      setUsers(prev => [result.user, ...prev])
      setShowAddUserDialog(false)
      setNewUserData({ name: '', email: '', password: '', role: 'CONTRIBUTOR' })
      setAddUserError('')
      
      setSuccessMessage('User created successfully')
      setShowSuccessMessage(true)
      
      loadStats()
    } catch (err) {
      setAddUserError(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  // Delete user
  const deleteUser = async () => {
    if (!userToDelete) return
    
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete user')
      
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
      setShowDeleteUserDialog(false)
      setUserToDelete(null)
      
      setSuccessMessage('User and all their recordings deleted successfully')
      setShowSuccessMessage(true)
      
      loadStats()
      loadRecordings()
    } catch (err) {
      setError('Failed to delete user')
      console.error('Error deleting user:', err)
    }
  }

  // Audio player
  const toggleAudio = async (recording: Recording) => {
    try {
      if (playingId === recording.id) {
        audioElement?.pause()
        setPlayingId(null)
        return
      }

      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }

      const audio = new Audio(`/api/recordings/${recording.id}/audio`)
      audio.addEventListener('ended', () => setPlayingId(null))
      audio.addEventListener('error', () => {
        setError('Failed to play audio')
        setPlayingId(null)
      })

      await audio.play()
      setAudioElement(audio)
      setPlayingId(recording.id)

    } catch (err) {
      setError('Failed to play audio')
      console.error('Audio playback error:', err)
    }
  }

  // Utility functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'error'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error'
      case 'MANAGER': return 'warning'
      case 'CONTRIBUTOR': return 'primary'
      case 'OBSERVER': return 'info'
      default: return 'default'
    }
  }

  // Filter data
  const filteredRecordings = recordings.filter(recording => {
    const matchesStatus = statusFilter === 'ALL' || recording.status === statusFilter
    const matchesSearch = !searchQuery || 
      recording.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recording.nameList.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recording.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesRole && matchesSearch
  })

  // Pagination
  const paginatedRecordings = filteredRecordings.slice(
    (recordingsPage - 1) * itemsPerPage,
    recordingsPage * itemsPerPage
  )
  
  const paginatedUsers = filteredUsers.slice(
    (usersPage - 1) * itemsPerPage,
    usersPage * itemsPerPage
  )

  // Load data on mount
  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      loadAllData()
    }
  }, [status, isAdmin])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
    }
  }, [audioElement])

  // Access control
  if (status === 'loading') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please sign in to access the management interface.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        </Box>
      </Container>
    )
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access denied. Administrator privileges required.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Project Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadAllData}
          disabled={isLoading}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Project Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main">
                  {stats.totalRecordings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Recordings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main">
                  {stats.pendingRecordings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="info.main">
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main">
                  {formatFileSize(stats.totalFileSize)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Storage
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Management Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab 
              icon={<Badge badgeContent={stats?.pendingRecordings || 0} color="warning"><QueueMusic /></Badge>} 
              label="Recordings" 
            />
            <Tab icon={<People />} label="Users" />
            <Tab icon={<Analytics />} label="Analytics" />
          </Tabs>
        </Box>

        {/* Users Tab */}
        {currentTab === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Roles</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="MANAGER">Manager</MenuItem>
                  <MenuItem value="CONTRIBUTOR">Contributor</MenuItem>
                  <MenuItem value="OBSERVER">Observer</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                size="small"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />

              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => {
                  setShowAddUserDialog(true)
                  setAddUserError('')
                }}
              >
                Add User
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Recordings</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          color={getRoleColor(user.role) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user._count.recordings}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Role">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowUserDialog(true)
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setUserToDelete(user)
                                setShowDeleteUserDialog(true)
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredUsers.length / itemsPerPage)}
                page={usersPage}
                onChange={(e, page) => setUsersPage(page)}
                color="primary"
              />
            </Box>
          </CardContent>
        )}
      </Card>

      {/* Add User Dialog */}
      <Dialog 
        open={showAddUserDialog} 
        onClose={() => {
          setShowAddUserDialog(false)
          setAddUserError('')
          setNewUserData({ name: '', email: '', password: '', role: 'CONTRIBUTOR' })
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          {addUserError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAddUserError('')}>
              {addUserError}
            </Alert>
          )}
          
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={newUserData.name}
              onChange={(e) => {
                setNewUserData(prev => ({ ...prev, name: e.target.value }))
                setAddUserError('')
              }}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={newUserData.email}
              onChange={(e) => {
                setNewUserData(prev => ({ ...prev, email: e.target.value }))
                setAddUserError('')
              }}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={newUserData.password}
              onChange={(e) => {
                setNewUserData(prev => ({ ...prev, password: e.target.value }))
                setAddUserError('')
              }}
              margin="normal"
              required
              helperText="Minimum 6 characters"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={newUserData.role}
                label="Role"
                onChange={(e) => {
                  setNewUserData(prev => ({ ...prev, role: e.target.value }))
                  setAddUserError('')
                }}
              >
                <MenuItem value="OBSERVER">Observer</MenuItem>
                <MenuItem value="CONTRIBUTOR">Contributor</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowAddUserDialog(false)
              setAddUserError('')
              setNewUserData({ name: '', email: '', password: '', role: 'CONTRIBUTOR' })
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={addUser}
            variant="contained"
            disabled={!newUserData.name || !newUserData.email || !newUserData.password}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteUserDialog} onClose={() => setShowDeleteUserDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete user "{userToDelete?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This will permanently delete:
            </Typography>
            <Box component="ul" sx={{ margin: '8px 0', paddingLeft: '20px' }}>
              <Typography component="li" variant="body2">The user account</Typography>
              <Typography component="li" variant="body2">All their recordings ({userToDelete?._count.recordings || 0} recordings)</Typography>
              <Typography component="li" variant="body2">All associated audio files</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              This action cannot be undone.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteUserDialog(false)}>Cancel</Button>
          <Button onClick={deleteUser} color="error" variant="contained">
            Delete User & Recordings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}