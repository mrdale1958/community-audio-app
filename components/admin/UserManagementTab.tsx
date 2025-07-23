import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Menu,
  Avatar,
} from '@mui/material';
import {
  MoreVert,
  Person,
  Edit,
  Search,
} from '@mui/icons-material';
import { formatTimeAgo } from '@/utils/formatters';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    recordings: number;
  };
}

export const UserManagementTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update user role:', error);
      return false;
    }
  };

  const handleRoleUpdate = async () => {
    if (selectedUser && newRole) {
      const success = await updateUserRole(selectedUser.id, newRole);
      if (success) {
        closeEditDialog();
      }
    }
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setActionMenuAnchor(event.currentTarget);
    setMenuUser(user);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setMenuUser(null);
  };

  const openEditDialog = () => {
    if (menuUser) {
      setSelectedUser(menuUser);
      setNewRole(menuUser.role);
      setEditDialogOpen(true);
      handleActionClose();
    }
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setNewRole('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'MANAGER': return 'warning';
      case 'CONTRIBUTOR': return 'primary';
      default: return 'default';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header & Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              User Management ({users.length} users)
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ maxWidth: 400 }}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Recordings</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {user._count.recordings} recordings
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {formatTimeAgo(user.createdAt)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {formatTimeAgo(user.updatedAt)}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, user)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={openEditDialog}>
          <Edit sx={{ mr: 1 }} />
          Edit Role
        </MenuItem>
      </Menu>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Change role for: {selectedUser?.name || selectedUser?.email}
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={newRole}
              label="Role"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="OBSERVER">Observer</MenuItem>
              <MenuItem value="CONTRIBUTOR">Contributor</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Role Permissions:</Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Observer:</strong> View only access<br/>
              <strong>Contributor:</strong> Can create recordings<br/>
              <strong>Manager:</strong> Can review and approve recordings<br/>
              <strong>Admin:</strong> Full system access
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button 
            onClick={handleRoleUpdate} 
            variant="contained"
            disabled={!newRole || newRole === selectedUser?.role}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};