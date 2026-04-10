import { StreamingSession } from './StreamingSession';

export interface StreamingOptions {
  language:        'ja' | 'en' | 'auto';
  onPartialResult: (text: string) => void;
  onFinalResult:   (text: string) => void;
  onError:         (err: Error) => void;
  maxDurationSec:  number;
}

// whisper.rn の WhisperContext 型（ネイティブ未リンク時は any で逃がす）
type WhisperContext = any;

class WhisperManager {
  private static instance: WhisperManager | null = null;
  private context: WhisperContext = null;

  private constructor() {}

  static getInstance(): WhisperManager {
    if (!WhisperManager.instance) {
      WhisperManager.instance = new WhisperManager();
    }
    return WhisperManager.instance;
  }

  async initialize(modelPath: string): Promise<void> {
    try {
      // whisper.rn を動的インポート（ネイティブモジュール未リンク時はエラーになる）
      const whisperRn = await import('whisper.rn').catch(() => null);
      if (!whisperRn) {
        console.warn('[WhisperManager] whisper.rn not available — running without native module');
        return;
      }

      const { initWhisper } = whisperRn as any;
      if (typeof initWhisper !== 'function') {
        console.warn('[WhisperManager] initWhisper not found in whisper.rn');
        return;
      }

      this.context = await initWhisper(modelPath);
      console.log('[WhisperManager] initialized with model:', modelPath);
    } catch (err) {
      console.warn('[WhisperManager] initialize failed:', err);
    }
  }

  async startStreaming(options: StreamingOptions): Promise<StreamingSession> {
    const session = new StreamingSession(this.context, options);
    await session.start();
    return session;
  }

  async stop(): Promise<void> {
    try {
      if (this.context && typeof this.context.stopTranscribeRealtime === 'function') {
        await this.context.stopTranscribeRealtime();
      }
    } catch (err) {
      console.warn('[WhisperManager] stop failed:', err);
    }
  }

  async release(): Promise<void> {
    try {
      if (this.context && typeof this.context.release === 'function') {
        await this.context.release();
      }
    } catch (err) {
      console.warn('[WhisperManager] release failed:', err);
    } finally {
      this.context = null;
    }
  }
}

export default WhisperManager;
