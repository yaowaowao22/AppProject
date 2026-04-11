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
  /** 最後に初期化したモデルのファイルパス（同一パスの再初期化を skip するため） */
  private modelPath: string | null = null;
  /** 並行初期化を防ぐためのロック用 Promise */
  private initializingPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): WhisperManager {
    if (!WhisperManager.instance) {
      WhisperManager.instance = new WhisperManager();
    }
    return WhisperManager.instance;
  }

  /** Whisper コンテキストが有効かどうかを返す */
  isReady(): boolean {
    return this.context !== null;
  }

  /** whisper.rn の WhisperContext を直接取得（file transcribe 用） */
  getContext(): WhisperContext {
    return this.context;
  }

  async initialize(modelPath: string): Promise<void> {
    // 同一モデルで既に初期化済みなら skip
    if (this.context !== null && this.modelPath === modelPath) return;

    // 並行初期化ガード: 進行中の初期化があればそれを待つ
    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = this._doInitialize(modelPath);
    try {
      await this.initializingPromise;
    } finally {
      this.initializingPromise = null;
    }
  }

  private async _doInitialize(modelPath: string): Promise<void> {
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

      this.context   = await initWhisper({ filePath: modelPath });
      this.modelPath = modelPath;
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

  async release(): Promise<void> {
    try {
      if (this.context && typeof this.context.release === 'function') {
        await this.context.release();
      }
    } catch (err) {
      console.warn('[WhisperManager] release failed:', err);
    } finally {
      this.context   = null;
      this.modelPath = null;
    }
  }
}

export default WhisperManager;
