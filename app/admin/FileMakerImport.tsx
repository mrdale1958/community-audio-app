// components/admin/FileMakerImport.tsx - Component for triggering FileMaker import

'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

interface ImportStats {
  totalRecords: number;
  totalNames: number;
  pagesCreated: number;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  message: string;
  data: {
    stats: ImportStats;
    result: {
      success: boolean;
      pagesCreated: number;
      dryRun?: boolean;
    };
  };
}

export default function FileMakerImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [seriesId, setSeriesId] = useState('aids-quilt-import');
  const [seriesTitle, setSeriesTitle] = useState('AIDS Quilt Memorial Names');

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/import/filemaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun,
          seriesId,
          seriesTitle,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.details || data.error || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          FileMaker Data Import
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Import names from the FileMaker Pro database into the recording system.
          This will create pages of names for contributors to record.
        </Typography>

        {/* Configuration */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Series ID"
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            margin="normal"
            helperText="Unique identifier for this import batch"
          />
          
          <TextField
            fullWidth
            label="Series Title"
            value={seriesTitle}
            onChange={(e) => setSeriesTitle(e.target.value)}
            margin="normal"
            helperText="Display name for this collection of pages"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
              />
            }
            label="Dry Run (Preview only - no database changes)"
          />
        </Box>

        {/* Import Button */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color={dryRun ? "secondary" : "primary"}
            onClick={handleImport}
            disabled={isImporting || !seriesId.trim() || !seriesTitle.trim()}
            startIcon={dryRun ? <PreviewIcon /> : <UploadIcon />}
            size="large"
          >
            {isImporting ? 'Processing...' : dryRun ? 'Preview Import' : 'Start Import'}
          </Button>
        </Box>

        {/* Progress */}
        {isImporting && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Connecting to FileMaker and processing records...
            </Typography>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Import Failed</Typography>
            {error}
          </Alert>
        )}

        {/* Success Result */}
        {result && result.success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">{result.message}</Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Records processed:</strong> {result.data.stats.totalRecords}
              </Typography>
              <Typography variant="body2">
                <strong>Names extracted:</strong> {result.data.stats.totalNames}
              </Typography>
              <Typography variant="body2">
                <strong>Pages {dryRun ? 'would be' : ''} created:</strong> {result.data.stats.pagesCreated}
              </Typography>
              
              {result.data.stats.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="warning.main">
                    <strong>Warnings:</strong> {result.data.stats.errors.length} issues
                  </Typography>
                </Box>
              )}
            </Box>

            {dryRun && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="info.main">
                  This was a preview. To actually import the data, uncheck "Dry Run" and run again.
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* Detailed Results */}
        {result && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Import Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="h6" gutterBottom>Statistics</Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={`${result.data.stats.totalRecords} Records`} />
                  <Chip label={`${result.data.stats.totalNames} Names`} />
                  <Chip label={`${result.data.stats.pagesCreated} Pages`} />
                  {result.data.result.dryRun && <Chip label="Preview Mode" color="secondary" />}
                </Box>

                {result.data.stats.errors.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Issues Encountered:
                    </Typography>
                    {result.data.stats.errors.map((error, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Info */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>How it works:</strong> This tool connects to the FileMaker database,
            extracts all names from the Panel Listing fields, removes duplicates, and 
            creates pages of 50 names each for recording. Each page gets a PDF that 
            contributors can download for offline recording.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}