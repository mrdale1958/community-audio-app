import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, Settings, Mic, Waves } from 'lucide-react';

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
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [channels, setChannels] = useState<AudioChannel[]>([
    { id: 'main', name: 'Main Gallery', volume: 0.8, muted: false, effects: {} },
    { id: 'entrance', name: 'Entrance Hall', volume: 0.6, muted: false, effects: {} },
    { id: 'reflection', name: 'Reflection Space', volume: 0.5, muted: false, effects: { reverb: { type: 'cathedral', wetness: 0.4 } } },
    { id: 'archive', name: 'Archive Room', volume: 0.7, muted: false, effects: {} }
  ]);
  const [soundCheck, setSoundCheck] = useState<SoundCheckData>({
    quietestRecording: { recordingId: '', averageDb: -35 },
    loudestRecording: { recordingId: '', averageDb: -8 },
    isRunning: false,
    currentPhase: 'idle'
  });
  const [playbackMode, setPlaybackMode] = useState<'sequential' | 'simultaneous' | 'staggered' | 'call_and_response'>('sequential');
  const [audioLevels, setAudioLevels] = useState({ left: 0, right: 0, peak: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simulated audio level monitoring
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setAudioLevels({
          left: Math.random() * 0.8,
          right: Math.random() * 0.8,
          peak: Math.random() * 0.9
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const startSoundCheck = async () => {
    setSoundCheck(prev => ({ ...prev, isRunning: true, currentPhase: 'quiet' }));
    
    // Simulate sound check sequence
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

  const AudioLevelMeter = ({ level, peak, label }: { level: number; peak: number; label: string }) => (
    <div className="flex items-center space-x-2">
      <span className="text-xs font-medium text-gray-600 w-8">{label}</span>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full flex">
          <div 
            className="bg-green-400 transition-all duration-75"
            style={{ width: `${Math.min(level * 100, 60)}%` }}
          />
          <div 
            className="bg-yellow-400 transition-all duration-75"
            style={{ width: `${Math.max(0, Math.min((level - 0.6) * 100 / 0.3, 25))}%` }}
          />
          <div 
            className="bg-red-400 transition-all duration-75"
            style={{ width: `${Math.max(0, (level - 0.85) * 100 / 0.15)}%` }}
          />
        </div>
        {peak > 0.9 && (
          <div className="absolute right-1 top-0 bottom-0 w-1 bg-red-600 animate-pulse" />
        )}
      </div>
      <span className="text-xs text-gray-500 w-10">{Math.round(level * 100)}%</span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Waves className="h-8 w-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gallery Audio Control</h2>
            <p className="text-gray-600">Exhibition playback management</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Playback Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Playback Control</h3>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-full transition-colors ${
                isPlaying 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
            
            <button className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <SkipForward className="h-6 w-6" />
            </button>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Master Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Playback Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Playback Mode</label>
            <select
              value={playbackMode}
              onChange={(e) => setPlaybackMode(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="sequential">Sequential</option>
              <option value="simultaneous">Simultaneous</option>
              <option value="staggered">Staggered Entry</option>
              <option value="call_and_response">Call & Response</option>
            </select>
          </div>
        </div>

        {/* Sound Check */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Sound Check</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Quietest Recording:</span>
              <span className="text-sm text-gray-600">{soundCheck.quietestRecording.averageDb} dB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Loudest Recording:</span>
              <span className="text-sm text-gray-600">{soundCheck.loudestRecording.averageDb} dB</span>
            </div>
            
            {soundCheck.isRunning && (
              <div className="text-center py-2">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  soundCheck.currentPhase === 'quiet' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  <Mic className="h-4 w-4 mr-1" />
                  Testing {soundCheck.currentPhase} levels
                </div>
              </div>
            )}
            
            <button
              onClick={startSoundCheck}
              disabled={soundCheck.isRunning}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {soundCheck.isRunning ? 'Running Sound Check...' : 'Start Sound Check'}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Level Meters */}
      {isPlaying && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Audio Levels</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <AudioLevelMeter level={audioLevels.left} peak={audioLevels.peak} label="L" />
            <AudioLevelMeter level={audioLevels.right} peak={audioLevels.peak} label="R" />
            <AudioLevelMeter level={audioLevels.peak} peak={audioLevels.peak} label="Peak" />
          </div>
        </div>
      )}

      {/* Channel Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Channel Zones</h3>
        <div className="grid gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{channel.name}</h4>
                <button
                  onClick={() => toggleChannelMute(channel.id)}
                  className={`p-2 rounded-full transition-colors ${
                    channel.muted 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {channel.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 w-16">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={channel.volume}
                  onChange={(e) => updateChannelVolume(channel.id, parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={channel.muted}
                />
                <span className="text-sm text-gray-600 w-10">{Math.round(channel.volume * 100)}%</span>
              </div>

              {showAdvanced && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reverb</span>
                    <span className="text-xs text-gray-500">
                      {channel.effects.reverb ? `${channel.effects.reverb.type} (${Math.round(channel.effects.reverb.wetness * 100)}%)` : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Compression</span>
                    <span className="text-xs text-gray-500">{channel.effects.compression ? 'On' : 'Off'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">EQ</span>
                    <span className="text-xs text-gray-500">{channel.effects.eq ? 'Custom' : 'Flat'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Status: {isPlaying ? 'Playing' : 'Stopped'} • Mode: {playbackMode}</span>
          <span>Queue: 1,247 recordings • Next in 2:45</span>
        </div>
      </div>
    </div>
  );
};

export default GalleryAudioControl;