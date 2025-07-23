// components/manage/AddUserDialog.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert
} from '@mui/material'
import type { User } from '../../types/manage'

interface NewUserFormData {
  name: string
  email: string
  password: string
  role: string
}

interface AddUserDialogProps {
  open: boolean
  onClose: () => void
  onAddUser: (user: User) => void
}

export function AddUserDialog({ open, onClose, onAddUser }: AddUserDialogProps) {
  const [formData, setFormData] = useState<NewUserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'CONTRIBUTOR'
  })
  const [dialogError, setDialogError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetDialog = () => {
    setFormData({ name: '', email: '', password: '', role: 'CONTRIBUTOR' })
    setDialogError('')
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required'
    if (!formData.email.trim()) return 'Email is required'
    if (!formData.password || formData.password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address'
    }
    
    return null
  }

  const handleSubmit = async () => {
    setDialogError('')
    
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setDialogError(validationError)
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.details && Array.isArray(errorData.details)) {
          setDialogError(errorData.details.join(', '))
          return
        }
        
        setDialogError(errorData.error || 'Failed to create user')
        return
      }
      
      const result = await response.json()
      
      // Success - notify parent and close dialog
      onAddUser(result.user)
      resetDialog()
      onClose()
      
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormField = (field: keyof NewUserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (dialogError) setDialogError('')
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New User</DialogTitle>
      <DialogContent>
        {dialogError && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            onClose={() => setDialogError('')}
          >
            {dialogError}
          </Alert>
        )}
        
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => updateFormField('name', e.target.value)}
            margin="normal"
            required
            disabled={isSubmitting}
          />
          
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormField('email', e.target.value)}
            margin="normal"
            required
            disabled={isSubmitting}
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => updateFormField('password', e.target.value)}
            margin="normal"
            required
            disabled={isSubmitting}
            helperText="Minimum 6 characters"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => updateFormField('role', e.target.value)}
              disabled={isSubmitting}
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
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.name || !formData.email || !formData.password || isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}