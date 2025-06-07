import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Box,
  Button,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

interface AdminFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  methodFilter: string;
  onMethodChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  totalRecordings: number;
  filteredCount: number;
  selectedCount: number;
  onClearFilters: () => void;
}

export const AdminFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  methodFilter,
  onMethodChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  totalRecordings,
  filteredCount,
  selectedCount,
  onClearFilters,
}: AdminFiltersProps) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            placeholder="Search recordings, users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="PROCESSING">Processing</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Method</InputLabel>
            <Select
              value={methodFilter}
              label="Method"
              onChange={(e) => onMethodChange(e.target.value)}
            >
              <MenuItem value="ALL">All Methods</MenuItem>
              <MenuItem value="LIVE">Live Recording</MenuItem>
              <MenuItem value="UPLOAD">File Upload</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => onSortByChange(e.target.value)}
            >
              <MenuItem value="createdAt">Date Created</MenuItem>
              <MenuItem value="updatedAt">Last Updated</MenuItem>
              <MenuItem value="duration">Duration</MenuItem>
              <MenuItem value="fileSize">File Size</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="userName">User Name</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={1}>
          <FormControl fullWidth>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            >
              <MenuItem value="desc">Newest</MenuItem>
              <MenuItem value="asc">Oldest</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Clear />}
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredCount} of {totalRecordings} recordings
            </Typography>
            {selectedCount > 0 && (
              <Chip 
                label={`${selectedCount} selected`} 
                color="primary" 
                size="small" 
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);