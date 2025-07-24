import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { CONFIG } from './config';

export interface AudioAnalysis {
  fileHash: string;
  duration: number | null;
  isCorrupted: boolean;
  error?: string;
}

export interface QABatchResult {
  processed: number;
  corrupted: number;
  errors: Array<{ recordingId: string; error: string }>;
  updated: number;
}

/**
 * Calculate SHA-256 hash of an audio file
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hash = createHash(CONFIG.HASH_ALGORITHM);
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    throw new Error(`Failed to calculate hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze audio file for duration and corruption
 * Note: This is a basic implementation. In production, you might want to use
 * a more sophisticated audio analysis library like node-ffmpeg or similar.
 */
export async function analyzeAudioFile(filePath: string): Promise<AudioAnalysis> {
  try {
    // Calculate file hash
    const fileHash = await calculateFileHash(filePath);
    
    // Check if file exists and is readable
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return {
        fileHash,
        duration: null,
        isCorrupted: true,
        error: 'Not a valid file'
      };
    }

    // Basic corruption check: file size should be reasonable
    if (stats.size < 1000) { // Less than 1KB is probably corrupted
      return {
        fileHash,
        duration: null,
        isCorrupted: true,
        error: 'File too small, likely corrupted'
      };
    }

    if (stats.size > CONFIG.MAX_FILE_SIZE) {
      return {
        fileHash,
        duration: null,
        isCorrupted: true,
        error: 'File exceeds maximum size limit'
      };
    }

    // Try to read the file header to check for basic audio file structure
    const fileBuffer = await fs.readFile(filePath, { flag: 'r' });
    const header = fileBuffer.slice(0, 12);
    
    // Basic audio format detection
    let isValidAudio = false;
    let estimatedDuration: number | null = null;

    // Check for common audio file signatures
    if (header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WAVE') {
      // WAV file
      isValidAudio = true;
      estimatedDuration = estimateWavDuration(fileBuffer);
    } else if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
      // MP3 file
      isValidAudio = true;
      estimatedDuration = estimateMp3Duration(stats.size);
    } else if (header.toString('ascii', 4, 8) === 'ftyp') {
      // MP4/M4A file
      isValidAudio = true;
      estimatedDuration = estimateMp4Duration(stats.size);
    } else if (header.toString('ascii', 0, 4) === 'OggS') {
      // OGG file
      isValidAudio = true;
      estimatedDuration = estimateOggDuration(stats.size);
    }

    return {
      fileHash,
      duration: estimatedDuration,
      isCorrupted: !isValidAudio,
      error: !isValidAudio ? 'Unrecognized audio format or corrupted header' : undefined
    };

  } catch (error) {
    return {
      fileHash: '',
      duration: null,
      isCorrupted: true,
      error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Estimate WAV file duration from header
 */
function estimateWavDuration(buffer: Buffer): number | null {
  try {
    // WAV header parsing - this is a simplified version
    const dataChunkOffset = buffer.indexOf('data');
    if (dataChunkOffset === -1) return null;
    
    const dataSize = buffer.readUInt32LE(dataChunkOffset + 4);
    const sampleRate = buffer.readUInt32LE(24);
    const bytesPerSecond = buffer.readUInt32LE(28);
    
    if (sampleRate > 0 && bytesPerSecond > 0) {
      return dataSize / bytesPerSecond;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Estimate MP3 duration (rough calculation based on file size)
 */
function estimateMp3Duration(fileSize: number): number | null {
  // Very rough estimation: assume average bitrate of 128kbps
  const averageBitrate = 128 * 1000 / 8; // bytes per second
  return fileSize / averageBitrate;
}

/**
 * Estimate MP4 duration (rough calculation based on file size)
 */
function estimateMp4Duration(fileSize: number): number | null {
  // Very rough estimation: assume average bitrate of 128kbps
  const averageBitrate = 128 * 1000 / 8; // bytes per second