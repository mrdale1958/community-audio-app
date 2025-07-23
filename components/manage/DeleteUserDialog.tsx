import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material'
import type { User } from '@/types/manage'

interface DeleteUserDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onDelete: (user: User) => void
}

export function DeleteUserDialog({ open, onClose, user, onDelete }: DeleteUserDialogProps) {
  const handleDelete = () => {
    if (user) {
      onDelete(user)
      onClose()
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Are you sure you want to delete user "{user.name}"?
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            This will permanently delete:
          </Typography>
          <Box component="ul" sx={{ margin: '8px 0', paddingLeft: '20px' }}>
            <Typography component="li" variant="body2">The user account</Typography>
            <Typography component="li" variant="body2">All their recordings ({user._count.recordings} recordings)</Typography>
            <Typography component="li" variant="body2">All associated audio files</Typography>
          </Box>
          <Typography variant="body2" fontWeight="bold">
            This action cannot be undone.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDelete} color="error" variant="contained">
          Delete User & Recordings
        </Button>
      </DialogActions>
    </Dialog>
  )
}
