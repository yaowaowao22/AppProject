import type { StreamingOptions } from './WhisperManager';

// whisper.rn の WhisperContext 型を動的インポート前提で参照
// ネイティブモジュール未リンク時はany型で逃がす
type WhisperContext = any;

export class StreamingSession {
  private context: WhisperContext;
  private options: StreamingOptions;
  private stopFlag: boolean = false;
  private mockTimer: ReturnType<typeof setTimeout> | null = null;

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
      const { promise, stop } = await this.context.transcribeRealtime({
        realtimeAudioSec: 3,
        language: this.options.language === 'auto' ? undefined : this.options.language,
        maxLen: 0,
      });

      // セグメント更新をサブスクライブ
      let lastText = '';
      promise
        .then((result: any) => {
          const finalText: string = result?.result ?? '';
          this.options.onFinalResult(finalText);
        })
        .catch((err: Error) => {
          this.options.onError(err);
        });

      // onNewSegments / subscribe パターンに対応
      if (typeof promise.subscribe === 'function') {
        promise.subscribe(({ isCapturing, segments }: any) => {
          const partial: string = (segments ?? [])
            .map((s: any) => s.text ?? '')
            .join(' ')
            .trim();

          if (partial !== lastText) {
            lastText = partial;
            this.options.onPartialResult(partial);
          }

          if (!isCapturing) {
            this.options.onFinalResult(partial);
          }
        });
      }

      // タイムアウト制御
      const maxMs = (this.options.maxDurationSec ?? 30) * 1000;
      this.mockTimer = setTimeout(() => {
        if (typeof stop === 'function') stop();
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
