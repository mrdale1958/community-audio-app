// components/manage/UsersTab.tsx
import React, { useState } from 'react'
import {
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Pagination
} from '@mui/material'
import {
  PersonAdd,
  Edit,
  Delete
} from '@mui/icons-material'
import { AddUserDialog } from './AddUserDialog'
import { EditUserDialog } from './EditUserDialog'
import { DeleteUserDialog } from './DeleteUserDialog'
import type { User, NewUserData } from '../../types/manage'

interface UsersTabProps {
  users: User[]
  onUpdateRole: (id: string, role: string) => void
  onAddUser: (user: User) => void  // Changed: now receives the created user, not user data
  onDeleteUser: (user: User) => void
}

export function UsersTab({ users, onUpdateRole, onAddUser, onDeleteUser }: UsersTabProps) {
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const itemsPerPage = 10

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error'
      case 'MANAGER': return 'warning'
      case 'CONTRIBUTOR': return 'primary'
      case 'OBSERVER': return 'info'
      default: return 'default'
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesRole && matchesSearch
  })

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <CardContent>
      {/* Filters and Add Button */}
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
          onClick={() => setShowAddDialog(true)}
        >
          Add User
        </Button>
      </Box>

      {/* Users Table */}
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
                          setShowEditDialog(true)
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
                          setSelectedUser(user)
                          setShowDeleteDialog(true)
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

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={Math.ceil(filteredUsers.length / itemsPerPage)}
          page={page}
          onChange={(e, newPage) => setPage(newPage)}
          color="primary"
        />
      </Box>

      {/* Dialogs */}
      <AddUserDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddUser={onAddUser}  // Pass through directly since interfaces now match
      />

      <EditUserDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        user={selectedUser}
        onUpdateRole={onUpdateRole}
      />

      <DeleteUserDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        user={selectedUser}
        onDelete={onDeleteUser}
      />
    </CardContent>
  )
}