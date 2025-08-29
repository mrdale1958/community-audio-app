// components/NameDisplay.tsx - Component to display names with metadata

'use client';

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
} from '@mui/material';

export interface NameWithMetadata {
  name: string;
  artifactNumber?: string | number;
  blockNumber?: string | number;
  originalRecord?: string;
}

interface NameDisplayProps {
  names: NameWithMetadata[];
  showMetadata?: boolean;
  compact?: boolean;
}

export default function NameDisplay({ 
  names, 
  showMetadata = true, 
  compact = false 
}: NameDisplayProps) {
  if (compact) {
    return (
      <Box>
        {names.map((nameItem, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="body2">
              {nameItem.name}
              {showMetadata && (nameItem.artifactNumber || nameItem.blockNumber) && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {nameItem.artifactNumber && `Artifact ${nameItem.artifactNumber}`}
                  {nameItem.artifactNumber && nameItem.blockNumber && ' • '}
                  {nameItem.blockNumber && `Block ${nameItem.blockNumber}`}
                </Typography>
              )}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <List dense>
      {names.map((nameItem, index) => (
        <ListItem key={index} divider>
          <ListItemText
            primary={nameItem.name}
            secondary={
              showMetadata && (nameItem.artifactNumber || nameItem.blockNumber) && (
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {nameItem.artifactNumber && (
                    <Chip 
                      label={`Artifact ${nameItem.artifactNumber}`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  )}
                  {nameItem.blockNumber && (
                    <Chip 
                      label={`Block ${nameItem.blockNumber}`} 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>
              )
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

// Utility component for page summary with metadata stats
export function PageMetadataStats({ names }: { names: NameWithMetadata[] }) {
  const stats = React.useMemo(() => {
    const artifacts = new Set<string>();
    const blocks = new Set<string>();
    
    names.forEach(nameItem => {
      if (nameItem.artifactNumber) artifacts.add(String(nameItem.artifactNumber));
      if (nameItem.blockNumber) blocks.add(String(nameItem.blockNumber));
    });

    return {
      totalNames: names.length,
      uniqueArtifacts: artifacts.size,
      uniqueBlocks: blocks.size,
      artifactsList: Array.from(artifacts).sort(),
      blocksList: Array.from(blocks).sort()
    };
  }, [names]);

  return (
    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Typography variant="h6" gutterBottom>
        Page Statistics
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Typography variant="h4" color="primary">
            {stats.totalNames}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Names
          </Typography>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Typography variant="h4" color="secondary">
            {stats.uniqueArtifacts}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Unique Artifacts
          </Typography>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Typography variant="h4" color="info.main">
            {stats.uniqueBlocks}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Unique Blocks
          </Typography>
        </Grid>
      </Grid>

      {stats.uniqueArtifacts > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Artifacts: {stats.artifactsList.join(', ')}
          </Typography>
        </Box>
      )}

      {stats.uniqueBlocks > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Blocks: {stats.blocksList.join(', ')}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}