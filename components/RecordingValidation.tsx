// components/RecordingValidation.tsx - Display validation results

'use client';

import React from 'react';
import {
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Timer,
  VolumeUp,
  GraphicEq,
} from '@mui/icons-material';

interface ValidationMetrics {
  duration: number;
  expectedDuration: number;
  durationPerName: number;
  loudness?: number;
  distortion?: number;
  silenceGaps?: number[];
  recognizedNames?: string[];
}

interface ValidationDisplayProps {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: ValidationMetrics;
  summary: string;
  namesCount: number;
}

export default function RecordingValidation({
  isValid,
  errors,
  warnings,
  metrics,
  summary,
  namesCount
}: ValidationDisplayProps) {
  const getSeverityColor = () => {
    if (!isValid) return 'error';
    if (warnings.length > 0) return 'warning';
    return 'success';
  };

  const getIcon = () => {
    if (!isValid) return <Error color="error" />;
    if (warnings.length > 0) return <Warning color="warning" />;
    return <CheckCircle color="success" />;
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Summary Alert */}
      <Alert 
        severity={getSeverityColor()} 
        icon={getIcon()}
        sx={{ mb: 2 }}
      >
        <Typography variant="subtitle2">
          {summary}
        </Typography>
      </Alert>

      {/* Metrics Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Timer sx={{ mr: 1 }} />
            Recording Metrics
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Duration: {metrics.duration.toFixed(1)}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expected: {metrics.expectedDuration.toFixed(1)}s
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metrics.duration / metrics.expectedDuration) * 100, 100)}
              color={getSeverityColor()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`${metrics.durationPerName.toFixed(1)}s per name`}
              color={
                metrics.durationPerName >= 2 && metrics.durationPerName <= 5 
                  ? 'success' 
                  : 'warning'
              }
              size="small"
            />
            
            <Chip 
              label={`${namesCount} names`}
              variant="outlined"
              size="small"
            />

            {metrics.loudness !== undefined && (
              <Chip 
                icon={<VolumeUp />}
                label={`${(metrics.loudness * 100).toFixed(0)}% volume`}
                color={metrics.loudness > 0.1 && metrics.loudness < 0.9 ? 'success' : 'warning'}
                size="small"
              />
            )}

            {metrics.distortion !== undefined && (
              <Chip 
                icon={<GraphicEq />}
                label={`${(metrics.distortion * 100).toFixed(1)}% distortion`}
                color={metrics.distortion < 0.05 ? 'success' : 'error'}
                size="small"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Critical Issues:
          </Typography>
          <List dense>
            {errors.map((error, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Error color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={error}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recommendations:
          </Typography>
          <List dense>
            {warnings.map((warning, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Warning color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={warning}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Future Features Preview */}
      {metrics.silenceGaps && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Advanced Analysis (Preview): Detected {metrics.silenceGaps.length} silence gaps
          </Typography>
        </Box>
      )}

      {metrics.recognizedNames && (
        <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Speech Recognition (Preview): Detected {metrics.recognizedNames.length} spoken words
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Helper component for live recording validation
export function LiveRecordingTimer({ 
  duration, 
  namesCount,
  isRecording 
}: { 
  duration: number; 
  namesCount: number;
  isRecording: boolean;
}) {
  const minDuration = namesCount * 2;
  const maxDuration = namesCount * 5;
  const targetDuration = namesCount * 3.5; // Sweet spot
  
  const getColor = () => {
    if (duration < minDuration) return 'error';
    if (duration > maxDuration) return 'error';
    if (duration > targetDuration * 1.2) return 'warning';
    return 'success';
  };

  const progress = Math.min((duration / targetDuration) * 100, 100);

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">
          {duration.toFixed(1)}s
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Target: {targetDuration.toFixed(1)}s
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progress}
        color={getColor()}
        sx={{ 
          height: 6, 
          borderRadius: 3,
          '& .MuiLinearProgress-bar': {
            transition: isRecording ? 'none' : 'transform 0.4s ease'
          }
        }}
      />
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {duration < minDuration && `Need ${(minDuration - duration).toFixed(1)}s more`}
        {duration >= minDuration && duration <= maxDuration && 'Good timing'}
        {duration > maxDuration && `${(duration - maxDuration).toFixed(1)}s too long`}
      </Typography>
    </Box>
  );
}