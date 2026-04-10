declare module 'whisper.rn' {
  export interface WhisperContext {
    transcribeRealtime(options?: {
      language?: string;
      maxLen?: number;
      tokenTimestamps?: boolean;
      tdrzEnable?: boolean;
      onNewSegments?: (segments: TranscribeRealtimeNativeEvent) => void;
    }): Promise<{ stop: () => Promise<void>; subscribe: (cb: (event: TranscribeRealtimeNativeEvent) => void) => void }>;
    stopTranscribeRealtime(): Promise<void>;
    release(): Promise<void>;
  }

  export interface TranscribeRealtimeNativeEvent {
    result: {
      text: string;
      segments: Array<{ text: string; t0: number; t1: number }>;
    };
    isCapturing: boolean;
  }

  export function initWhisper(options: {
    filePath: string;
    coreMLModelAsset?: { filename: string; assets: number[] };
  } | string): Promise<WhisperContext>;
}
