// hooks/useAudioPlayer.ts
import { useState, useRef } from 'react';

export const useAudioPlayer = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPause = async (recordingId: string) => {
    if (playingId === recordingId) {
      // Pause current recording
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Start new recording
      const audio = new Audio(`/api/recordings/${recordingId}/audio`);
      audio.addEventListener('ended', () => setPlayingId(null));
      audio.addEventListener('error', () => {
        console.error('Error playing audio');
        setPlayingId(null);
      });
      
      try {
        await audio.play();
        audioRef.current = audio;
        setPlayingId(recordingId);
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  };

  return {
    playingId,
    playPause,
    isPlaying: (id: string) => playingId === id,
  };
};

