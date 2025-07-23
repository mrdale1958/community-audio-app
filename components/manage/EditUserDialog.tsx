import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material'
import type { User } from '@/types/manage'

interface EditUserDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onUpdateRole: (id: string, role: string) => void
}

export function EditUserDialog({ open, onClose, user, onUpdateRole }: EditUserDialogProps) {
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role)
    }
  }, [user])

  const handleSubmit = () => {
    if (user && selectedRole) {
      onUpdateRole(user.id, selectedRole)
      onClose()
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit User Role</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography gutterBottom>
            <strong>User:</strong> {user.name} ({user.email})
          </Typography>
          <Typography gutterBottom>
            <strong>Current Role:</strong> {user.role}
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Role</InputLabel>
            <Select
              value={selectedRole}
              label="New Role"
              onChange={(e) => setSelectedRole(e.target.value)}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Update Role
        </Button>
      </DialogActions>
    </Dialog>
  )
}

