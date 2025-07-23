// hooks/useAudioPlayer.ts
import { useState, useEffect, useCallback } from 'react'
import type { Recording } from '../types/manage'

export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const toggleAudio = useCallback(async (recording: Recording) => {
    try {
      if (playingId === recording.id) {
        audioElement?.pause()
        setPlayingId(null)
        return
      }

      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }

      const audio = new Audio(`/api/recordings/${recording.id}/audio`)
      audio.addEventListener('ended', () => setPlayingId(null))
      audio.addEventListener('error', () => {
        console.error('Failed to play audio')
        setPlayingId(null)
      })

      await audio.play()
      setAudioElement(audio)
      setPlayingId(recording.id)

    } catch (err) {
      console.error('Audio playback error:', err)
    }
  }, [playingId, audioElement])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
    }
  }, [audioElement])

  return {
    playingId,
    toggleAudio
  }
}