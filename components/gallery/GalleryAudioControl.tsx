"use client";

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import {
  PlayArrow,
  Pause,
  SkipNext,
  Settings,
  VolumeUp,
  VolumeOff,
  Mic,
  GraphicEq
} from '@mui/icons-material';

interface AudioChannel {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  spatialPosition?: { x: number; y: number; z: number };
  effects: {
    reverb?: { type: string; wetness: number };
    compression?: boolean;
    eq?: boolean;
  };
}

interface SoundCheckData {
  quietestRecording: { recordingId: string; averageDb: number };
  loudestRecording: { recordingId: string; averageDb: number };
  isRunning: boolean;
  currentPhase: 'quiet' | 'loud' | 'idle';
}

const GalleryAudioControl = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const [channels, setChannels] = useState<AudioChannel[]>([
    { id: 'main', name: 'Main Gallery', volume: 80, muted: false, effects: {} },
    { id: 'entrance', name: 'Entrance Hall', volume: 60, muted: false, effects: {} },
    { id: 'reflection', name: 'Reflection Space', volume: 50, muted: false, effects: { reverb: { type: 'cathedral', wetness: 0.4 } } },
    { id: 'archive', name: 'Archive Room', volume: 70, muted: false, effects: {} }
  ]);
  const [soundCheck, setSoundCheck] = useState<SoundCheckData>({
    quietestRecording: { recordingId: '', averageDb: -35 },
    loudestRecording: { recordingId: '', averageDb: -8 },
    isRunning: false,
    currentPhase: 'idle'
  });
  const [playbackMode, setPlaybackMode] = useState('sequential');
  const [audioLevels, setAudioLevels] = useState({ left: 0, right: 0, peak: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simulated audio level monitoring
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setAudioLevels({
          left: Math.random() * 80,
          right: Math.random() * 80,
          peak: Math.random() * 90
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const startSoundCheck = async () => {
    setSoundCheck(prev => ({ ...prev, isRunning: true, currentPhase: 'quiet' }));
    
    setTimeout(() => {
      setSoundCheck(prev => ({ ...prev, currentPhase: 'loud' }));
    }, 5000);
    
    setTimeout(() => {
      setSoundCheck(prev => ({ ...prev, currentPhase: 'quiet' }));
    }, 10000);
    
    setTimeout(() => {
      setSoundCheck(prev => ({ ...prev, isRunning: false, currentPhase: 'idle' }));
    }, 15000);
  };

  const updateChannelVolume = (channelId: string, volume: number) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, volume } : ch
    ));
  };

  const toggleChannelMute = (channelId: string) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, muted: !ch.muted } : ch
    ));
  };

  const AudioLevelMeter = ({ level, label }: { level: number; label: string }) => (
    <Box display="flex" alignItems="center" gap={2} mb={1}>
      <Typography variant="caption" sx={{ minWidth: 20, fontWeight: 'bold' }}>
        {label}
      </Typography>
      <Box flexGrow={1}>
        <LinearProgress 
          variant="determinate" 
          value={level} 
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: level > 85 ? 'error.main' : level > 60 ? 'warning.main' : 'success.main',
              borderRadius: 6,
            }
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 30, textAlign: 'right' }}>
        {Math.round(level)}%
      </Typography>
    </Box>
  );

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <GraphicEq color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h2" fontWeight="bold">
              Gallery Audio Control
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exhibition playback management
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
          <Settings />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Playback Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Playback Control
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <IconButton
                  onClick={() => setIsPlaying(!isPlaying)}
                  color={isPlaying ? "error" : "success"}
                  size="large"
                  sx={{ p: 2 }}
                >
                  {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                </IconButton>
                
                <IconButton size="large">
                  <SkipNext sx={{ fontSize: 32 }} />
                </IconButton>
                
                <Box flexGrow={1} ml={2}>
                  <Typography variant="body2" gutterBottom>
                    Master Volume
                  </Typography>
                  <Slider
                    value={masterVolume}
                    onChange={(_, value) => setMasterVolume(value as number)}
                    valueLabelDisplay="auto"
                    max={100}
                  />
                </Box>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Playback Mode</InputLabel>
                <Select
                  value={playbackMode}
                  label="Playback Mode"
                  onChange={(e) => setPlaybackMode(e.target.value)}
                >
                  <MenuItem value="sequential">Sequential</MenuItem>
                  <MenuItem value="simultaneous">Simultaneous</MenuItem>
                  <MenuItem value="staggered">Staggered Entry</MenuItem>
                  <MenuItem value="call_and_response">Call & Response</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Sound Check */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sound Check
              </Typography>
              
              <Box bgcolor="grey.50" borderRadius={2} p={2} mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Quietest Recording:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {soundCheck.quietestRecording.averageDb} dB
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Loudest Recording:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {soundCheck.loudestRecording.averageDb} dB
                  </Typography>
                </Box>
                
                {soundCheck.isRunning && (
                  <Box textAlign="center" mb={2}>
                    <Chip
                      icon={<Mic />}
                      label={`Testing ${soundCheck.currentPhase} levels`}
                      color={soundCheck.currentPhase === 'quiet' ? 'info' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                )}
                
                <Button
                  onClick={startSoundCheck}
                  disabled={soundCheck.isRunning}
                  variant="contained"
                  fullWidth
                >
                  {soundCheck.isRunning ? 'Running Sound Check...' : 'Start Sound Check'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Audio Level Meters */}
        {isPlaying && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Audio Levels
                </Typography>
                <AudioLevelMeter level={audioLevels.left} label="L" />
                <AudioLevelMeter level={audioLevels.right} label="R" />
                <AudioLevelMeter level={audioLevels.peak} label="Peak" />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Channel Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Channel Zones
              </Typography>
              <Grid container spacing={2}>
                {channels.map((channel) => (
                  <Grid item xs={12} sm={6} key={channel.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {channel.name}
                        </Typography>
                        <IconButton
                          onClick={() => toggleChannelMute(channel.id)}
                          color={channel.muted ? "error" : "default"}
                        >
                          {channel.muted ? <VolumeOff /> : <VolumeUp />}
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" gutterBottom>
                        Volume: {channel.volume}%
                      </Typography>
                      <Slider
                        value={channel.volume}
                        onChange={(_, value) => updateChannelVolume(channel.id, value as number)}
                        disabled={channel.muted}
                        max={100}
                        size="small"
                      />

                      <Collapse in={showAdvanced}>
                        <Box mt={2} pt={2} borderTop={1} borderColor="grey.200">
                          <Typography variant="caption" display="block" gutterBottom>
                            Effects:
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Reverb: {channel.effects.reverb ? `${channel.effects.reverb.type} (${Math.round(channel.effects.reverb.wetness * 100)}%)` : 'Off'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Compression: {channel.effects.compression ? 'On' : 'Off'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            EQ: {channel.effects.eq ? 'Custom' : 'Flat'}
                          </Typography>
                        </Box>
                      </Collapse>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status */}
      <Box borderTop={1} borderColor="grey.200" pt={2} mt={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Status: {isPlaying ? 'Playing' : 'Stopped'} • Mode: {playbackMode}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Queue: 1,247 recordings • Next in 2:45
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default GalleryAudioControl;