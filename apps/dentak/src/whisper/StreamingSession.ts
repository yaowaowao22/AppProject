import type { StreamingOptions } from './WhisperManager';

// whisper.rn の WhisperContext 型を動的インポート前提で参照
// ネイティブモジュール未リンク時はany型で逃がす
type WhisperContext = any;

export class StreamingSession {
  private context: WhisperContext;
  private options: StreamingOptions;
  private stopFlag: boolean = false;
  private mockTimer: ReturnType<typeof setTimeout> | null = null;
  /** whisper.rn transcribeRealtime の stop 関数（ネイティブ停止用） */
  private nativeStop: (() => Promise<void>) | null = null;

  constructor(context: WhisperContext, options: StreamingOptions) {
    this.context = context;
    this.options = options;
  }

  async start(): Promise<void> {
    // ネイティブ whisper.rn コンテキストが有効かチェック
    if (!this.context || typeof this.context.transcribeRealtime !== 'function') {
      console.warn('[StreamingSession] whisper.rn not available — running mock mode');
      this.runMock();
      return;
    }

    try {
      // whisper.rn 0.5.5: transcribeRealtime は { stop, subscribe } を返す
      const { stop, subscribe } = await this.context.transcribeRealtime({
        realtimeAudioSec: this.options.maxDurationSec ?? 30,
        language: this.options.language === 'auto' ? undefined : this.options.language,
      });

      this.nativeStop = stop;

      // transcribeRealtime が resolve した後に stop() が呼ばれていた場合は即座に停止する
      // （start() 待機中に stop() → nativeStop が null のまま終わる競合を防ぐ）
      if (this.stopFlag) {
        void stop();
        this.nativeStop = null;
        return;
      }

      // subscribe コールバックで部分結果・完了結果を受信
      subscribe((event: any) => {
        if (event.error) {
          this.options.onError(new Error(event.error));
          return;
        }
        const text: string = event.data?.result ?? '';
        if (!event.isCapturing) {
          // ストリーミング完了 — 空文字でも呼び出す（呼び出し側で処理判断）
          this.options.onFinalResult(text);
        } else if (text.trim()) {
          // 部分認識結果（空白のみは無視）
          this.options.onPartialResult(text);
        }
      });

      // タイムアウト制御
      const maxMs = (this.options.maxDurationSec ?? 30) * 1000;
      this.mockTimer = setTimeout(() => {
        void this.nativeStop?.();
        this.nativeStop = null;
      }, maxMs);
    } catch (err) {
      console.warn('[StreamingSession] transcribeRealtime failed, falling back to mock:', err);
      this.runMock();
    }
  }

  stop(): void {
    this.stopFlag = true;
    if (this.mockTimer !== null) {
      clearTimeout(this.mockTimer);
      this.mockTimer = null;
    }
    if (this.nativeStop) {
      void this.nativeStop();
      this.nativeStop = null;
    }
  }

  // whisper.rn が利用不可の場合のフォールバック: 3秒後に空結果を返す
  private runMock(): void {
    this.mockTimer = setTimeout(() => {
      if (!this.stopFlag) {
        this.options.onFinalResult('');
      }
    }, 3000);
  }
}
