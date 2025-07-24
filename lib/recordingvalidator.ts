/// <reference lib="dom" />
// lib/recordingValidator.ts - Recording validation and quality checks

// Type guard for browser environment
const isBrowser = typeof window !== 'undefined';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    duration: number;
    expectedDuration: number;
    durationPerName: number;
    // Future metrics (stubbed)
    loudness?: number;
    distortion?: number;
    silenceGaps?: number[];
    recognizedNames?: string[];
  };
}

export interface ValidationOptions {
  namesCount: number;
  minDurationPerName?: number;
  maxDurationPerName?: number;
  // Future options (stubbed)
  checkLoudness?: boolean;
  checkDistortion?: boolean;
  checkSilenceGaps?: boolean;
  verifySpokenNames?: boolean;
}

export class RecordingValidator {
  private static readonly DEFAULT_MIN_DURATION_PER_NAME = 2; // seconds
  private static readonly DEFAULT_MAX_DURATION_PER_NAME = 5; // seconds
  
  /**
   * Validate a recording based on duration and name count
   */
  static async validateRecording(
    audioFile: File | Blob,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metrics: {
        duration: 0,
        expectedDuration: 0,
        durationPerName: 0
      }
    };

    try {
      // Check if we can get audio duration (browser only)
      let duration = 0;
      if (isBrowser) {
        duration = await this.getAudioDuration(audioFile);
      } else {
        // Server-side: estimate duration from file size (rough approximation)
        // For more accurate server-side duration, we'd need a library like ffprobe
        const estimatedBitrate = 128000; // 128 kbps estimate
        duration = (audioFile.size * 8) / estimatedBitrate;
        result.warnings.push('Duration estimated from file size. Actual validation will occur in browser.');
      }
      
      const minDurationPerName = options.minDurationPerName || this.DEFAULT_MIN_DURATION_PER_NAME;
      const maxDurationPerName = options.maxDurationPerName || this.DEFAULT_MAX_DURATION_PER_NAME;
      
      const minTotalDuration = options.namesCount * minDurationPerName;
      const maxTotalDuration = options.namesCount * maxDurationPerName;
      const expectedDuration = options.namesCount * ((minDurationPerName + maxDurationPerName) / 2);
      const durationPerName = duration / options.namesCount;

      // Update metrics
      result.metrics.duration = duration;
      result.metrics.expectedDuration = expectedDuration;
      result.metrics.durationPerName = durationPerName;

      // Duration validation
      if (duration < minTotalDuration) {
        result.errors.push(
          `Recording is too short. Expected at least ${minTotalDuration}s for ${options.namesCount} names, but got ${duration.toFixed(1)}s`
        );
        result.isValid = false;
      }

      if (duration > maxTotalDuration) {
        result.errors.push(
          `Recording is too long. Expected at most ${maxTotalDuration}s for ${options.namesCount} names, but got ${duration.toFixed(1)}s`
        );
        result.isValid = false;
      }

      // Per-name duration warnings
      if (durationPerName < minDurationPerName) {
        result.warnings.push(
          `Average time per name (${durationPerName.toFixed(1)}s) is below recommended minimum (${minDurationPerName}s)`
        );
      }

      if (durationPerName > maxDurationPerName) {
        result.warnings.push(
          `Average time per name (${durationPerName.toFixed(1)}s) is above recommended maximum (${maxDurationPerName}s)`
        );
      }

      // Future validations (stubbed) - only run in browser
      if (isBrowser) {
        if (options.checkLoudness) {
          await this.validateLoudness(audioFile, result);
        }

        if (options.checkDistortion) {
          await this.validateDistortion(audioFile, result);
        }

        if (options.checkSilenceGaps) {
          await this.validateSilenceGaps(audioFile, result);
        }

        if (options.verifySpokenNames) {
          await this.verifySpokenNames(audioFile, options.namesCount, result);
        }
      }

    } catch (error) {
      result.errors.push(`Failed to validate recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get audio duration from file
   */
  private static async getAudioDuration(audioFile: File | Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      // Simple browser check using feature detection
      if (typeof document === 'undefined') {
        reject(new Error('Audio duration extraction requires browser environment'));
        return;
      }

      const audio = document.createElement('audio');
      const url = URL.createObjectURL(audioFile);
      
      let timeoutId: NodeJS.Timeout | number;
      
      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
      
      const handleLoadedMetadata = () => {
        cleanup();
        resolve(audio.duration);
      };
      
      const handleError = () => {
        cleanup();
        reject(new Error('Failed to load audio file'));
      };
      
      const handleTimeout = () => {
        cleanup();
        reject(new Error('Timeout loading audio file'));
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleError);
      
      // Set a timeout to prevent hanging
      timeoutId = setTimeout(handleTimeout, 10000);
      
      audio.src = url;
    });
  }

  /**
   * Validate recording loudness (STUB - future implementation)
   */
  private static async validateLoudness(
    audioFile: File | Blob, 
    result: ValidationResult
  ): Promise<void> {
    // TODO: Implement loudness analysis
    // - Use Web Audio API to analyze amplitude
    // - Check for consistent volume levels
    // - Detect if recording is too quiet
    
    try {
      // Stub implementation
      const loudness = await this.analyzeLoudness(audioFile);
      result.metrics.loudness = loudness;
      
      if (loudness < 0.1) {
        result.warnings.push('Recording appears to be very quiet. Consider recording closer to the microphone.');
      }
      
      if (loudness > 0.9) {
        result.warnings.push('Recording may be too loud and could have distortion.');
      }
    } catch (error) {
      result.warnings.push('Could not analyze recording loudness');
    }
  }

  /**
   * Validate recording for distortion (STUB - future implementation)
   */
  private static async validateDistortion(
    audioFile: File | Blob,
    result: ValidationResult
  ): Promise<void> {
    // TODO: Implement distortion detection
    // - Analyze for clipping
    // - Check frequency spectrum for artifacts
    // - Detect digital distortion
    
    try {
      const distortion = await this.analyzeDistortion(audioFile);
      result.metrics.distortion = distortion;
      
      if (distortion > 0.05) {
        result.errors.push('Recording contains significant distortion. Please re-record with lower input levels.');
        result.isValid = false;
      }
    } catch (error) {
      result.warnings.push('Could not analyze recording for distortion');
    }
  }

  /**
   * Validate silence gaps between names (STUB - future implementation)
   */
  private static async validateSilenceGaps(
    audioFile: File | Blob,
    result: ValidationResult
  ): Promise<void> {
    // TODO: Implement silence gap detection
    // - Detect periods of low amplitude
    // - Identify gaps between spoken names
    // - Verify appropriate spacing
    
    try {
      const gaps = await this.detectSilenceGaps(audioFile);
      result.metrics.silenceGaps = gaps;
      
      const expectedGaps = result.metrics.expectedDuration / result.metrics.durationPerName - 1;
      
      if (gaps.length < expectedGaps * 0.8) {
        result.warnings.push('Fewer silence gaps detected than expected. Names may be spoken too quickly together.');
      }
      
      if (gaps.some(gap => gap > 3)) {
        result.warnings.push('Some silence gaps are very long. Consider re-recording with more consistent pacing.');
      }
    } catch (error) {
      result.warnings.push('Could not analyze silence gaps');
    }
  }

  /**
   * Verify spoken names match expected names (STUB - future implementation)
   */
  private static async verifySpokenNames(
    audioFile: File | Blob,
    expectedNameCount: number,
    result: ValidationResult
  ): Promise<void> {
    // TODO: Implement speech recognition
    // - Use Web Speech API or external service
    // - Extract spoken text from audio
    // - Compare with expected names
    // - Check pronunciation accuracy
    
    try {
      const recognizedNames = await this.recognizeSpeech(audioFile);
      result.metrics.recognizedNames = recognizedNames;
      
      if (recognizedNames.length !== expectedNameCount) {
        result.warnings.push(
          `Speech recognition detected ${recognizedNames.length} names, but expected ${expectedNameCount}. ` +
          'This may indicate unclear speech or technical issues.'
        );
      }
      
      // Additional checks could include:
      // - Matching against expected name list
      // - Checking pronunciation quality
      // - Detecting skipped names
      
    } catch (error) {
      result.warnings.push('Could not verify spoken names');
    }
  }

  // STUB METHODS - Future implementations

  private static async analyzeLoudness(audioFile: File | Blob): Promise<number> {
    // TODO: Implement using Web Audio API
    // Return normalized loudness value (0-1)
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async work
    return Math.random() * 0.8 + 0.1; // Mock value
  }

  private static async analyzeDistortion(audioFile: File | Blob): Promise<number> {
    // TODO: Implement distortion analysis
    // Return distortion level (0-1, where >0.05 is problematic)
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() * 0.03; // Mock low distortion
  }

  private static async detectSilenceGaps(audioFile: File | Blob): Promise<number[]> {
    // TODO: Implement silence detection
    // Return array of gap durations in seconds
    await new Promise(resolve => setTimeout(resolve, 100));
    return [0.5, 0.8, 0.6, 0.7]; // Mock gaps
  }

  private static async recognizeSpeech(audioFile: File | Blob): Promise<string[]> {
    // TODO: Implement speech recognition
    // Return array of recognized words/names
    await new Promise(resolve => setTimeout(resolve, 100));
    return ['John', 'Smith', 'Jane', 'Doe']; // Mock recognized names
  }

  /**
   * Get validation summary for UI display
   */
  static getValidationSummary(result: ValidationResult): string {
    if (result.isValid && result.warnings.length === 0) {
      return 'Recording quality is excellent';
    }
    
    if (result.isValid && result.warnings.length > 0) {
      return `Recording is acceptable with ${result.warnings.length} minor issue${result.warnings.length === 1 ? '' : 's'}`;
    }
    
    return `Recording has ${result.errors.length} critical issue${result.errors.length === 1 ? '' : 's'} that must be fixed`;
  }
}