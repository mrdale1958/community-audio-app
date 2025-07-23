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
} from '@mui/material';
import { Search } from '@mui/icons-material';

interface RecordingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  methodFilter: string;
  onMethodChange: (value: string) => void;
  totalRecordings: number;
  filteredCount: number;
}

export const RecordingFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  methodFilter,
  onMethodChange,
  totalRecordings,
  filteredCount,
}: RecordingFiltersProps) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search recordings..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
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
        <Grid item xs={12} md={3}>
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
          <Typography variant="body2" color="text.secondary">
            {filteredCount} of {totalRecordings} recordings
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);