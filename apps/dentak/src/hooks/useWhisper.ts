// ══════════════════════════════════════════════
// 無音の演算 — useWhisper
// VoiceOverlay 状態遷移 (DESIGN.md §8):
//   idle → requesting_permission → listening → processing → applied → idle
//   ├─ 権限拒否: idle + error
//   └─ エラー:   idle + error
// ══════════════════════════════════════════════

import { useRef, useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import WhisperManager from '../whisper/WhisperManager';
import type { StreamingSession } from '../whisper/StreamingSession';
import { parseVoiceInput } from '../whisper/voiceParser';
import type { ParseResult } from '../whisper/voiceParser';
import { useSettingsStore } from '../store/settingsStore';
import { useCalculatorStore } from '../store/calculatorStore';
import { useModelStore } from '../store/modelStore';
import { getLocalModelPath } from '../whisper/modelRegistry';

/** DESIGN.md §8 VoiceOverlay 状態遷移の 5 状態 */
export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'applied';

export interface UseWhisperReturn {
  voiceState:     VoiceState;
  /** ストリーミング中の部分認識テキスト */
  partialText:    string;
  /** 確定テキスト（processing 完了後にセット） */
  finalText:      string;
  /** エラーメッセージ（null = エラーなし） */
  error:          string | null;
  startListening: () => Promise<void>;
  stopListening:  () => void;
}

/** タイムアウト: settingsStore 由来ではなくハードコード 30 秒 */
const TIMEOUT_MS = 30_000;
/** applied → idle の遷移待機時間 */
const APPLIED_LINGER_MS = 800;

export function useWhisper(): UseWhisperReturn {
  const [voiceState, setVoiceState]   = useState<VoiceState>('idle');
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText]     = useState('');
  const [error, setError]             = useState<string | null>(null);

  // Mutable refs — コールバック内で最新値を参照（再レンダリング不要）
  const sessionRef     = useRef<StreamingSession | null>(null);
  const partialTextRef = useRef('');
  /** 二重実行防止フラグ: onFinalResult / stopListening / timeout の競合を抑制 */
  const processedRef   = useRef(false);
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voiceLang       = useSettingsStore((s) => s.voiceLang);
  const applyVoiceResult = useCalculatorStore((s) => s.applyVoiceResult);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * テキストをパースして calculatorStore に反映する。
   * processedRef で二重実行を防止（onFinalResult / timeout / stopListening のいずれが
   * 最初に呼んでも 1 回だけ実行される）。
   */
  const processAndApply = useCallback(
    (text: string) => {
      if (processedRef.current) return;
      processedRef.current = true;

      clearTimer();

      // 空文字 = Whisper が何も認識できなかった → エラーフィードバック
      if (!text.trim()) {
        setError('音声を認識できませんでした');
        setVoiceState('idle');
        return;
      }

      setVoiceState('processing');
      setFinalText(text);

      const result: ParseResult = parseVoiceInput(text);
      applyVoiceResult(result);

      setVoiceState('applied');
      setTimeout(() => setVoiceState('idle'), APPLIED_LINGER_MS);
    },
    [applyVoiceResult, clearTimer],
  );

  /** 手動停止: セッション停止 → 現在の partialText で即時処理 */
  const stopListening = useCallback(() => {
    clearTimer();
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    processAndApply(partialTextRef.current);
  }, [processAndApply, clearTimer]);

  const startListening = useCallback(async () => {
    try {
      // ── リセット ──────────────────────────────────────
      setError(null);
      setPartialText('');
      setFinalText('');
      partialTextRef.current = '';
      processedRef.current   = false;

      setVoiceState('requesting_permission');

      // ── マイク権限 (Just-in-Time) ─────────────────────
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setVoiceState('idle');
        setError('マイク権限が必要です');
        return;
      }

      setVoiceState('listening');

      // ── 30 秒タイムアウト ─────────────────────────────
      // stopListening に依存させず、refs を直接参照してインライン実行
      timeoutRef.current = setTimeout(() => {
        if (sessionRef.current) {
          sessionRef.current.stop();
          sessionRef.current = null;
        }
        processAndApply(partialTextRef.current);
      }, TIMEOUT_MS);

      // ── WhisperManager 未初期化時の自動初期化 ────────────
      // アプリ再起動後、modelStore は永続化済みだが WhisperManager.context は null。
      // startStreaming 前に初期化することで mock モードへのフォールバックを防ぐ。
      const manager = WhisperManager.getInstance();
      if (!manager.isReady()) {
        const { activeModelId, downloadedModels } = useModelStore.getState();
        if (downloadedModels.includes(activeModelId)) {
          try {
            await manager.initialize(getLocalModelPath(activeModelId));
          } catch {
            // 初期化失敗 — startStreaming 側で mock フォールバックが動く
          }
        }
      }

      // ── ストリーミング開始 ────────────────────────────
      try {
        const session = await WhisperManager.getInstance().startStreaming({
          language:        voiceLang,
          maxDurationSec:  30,
          onPartialResult: (text) => {
            setPartialText(text);
            partialTextRef.current = text;
          },
          onFinalResult: (text) => {
            // ネイティブ whisper.rn がストリーム完了時にここを呼ぶ
            partialTextRef.current = text;
            processAndApply(text);
          },
          onError: (_err) => {
            clearTimer();
            processedRef.current = true; // 以降の processAndApply 呼び出しを封鎖
            setError('認識に失敗しました');
            setVoiceState('idle');
          },
        });
        sessionRef.current = session;
      } catch (_err) {
        clearTimer();
        setError('録音を開始できませんでした');
        setVoiceState('idle');
      }
    } catch (_err) {
      // Audio.requestPermissionsAsync などの予期しない例外をキャッチ
      setError('録音を開始できませんでした');
      setVoiceState('idle');
    }
  }, [voiceLang, processAndApply, clearTimer]);

  // アンマウント時のクリーンアップ
  // ⚠️ WhisperManager.release() はここで呼ばない。
  // release() を呼ぶと context が null になり、次回マウント時に startStreaming() が
  // モックモードへフォールバックしてしまう（モデル切替時は switchModel() 経由で release → initialize）。
  useEffect(() => {
    return () => {
      clearTimer();
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
    };
  }, [clearTimer]);

  return {
    voiceState,
    partialText,
    finalText,
    error,
    startListening,
    stopListening,
  };
}
