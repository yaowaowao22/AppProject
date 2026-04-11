// ══════════════════════════════════════════════
// 無音の演算 — useWhisper
// VoiceOverlay 状態遷移 (DESIGN.md §8):
//   idle → requesting_permission → listening → processing → applied → idle
//   ├─ 権限拒否: idle + error
//   └─ エラー:   idle + error
// ══════════════════════════════════════════════

import { useRef, useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import WhisperManager from '../whisper/WhisperManager';
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
  partialText:    string;
  finalText:      string;
  error:          string | null;
  startListening: () => Promise<void>;
  stopListening:  () => void;
}

const TIMEOUT_MS = 30_000;
const APPLIED_LINGER_MS = 800;

export function useWhisper(): UseWhisperReturn {
  const [voiceState, setVoiceState]   = useState<VoiceState>('idle');
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText]     = useState('');
  const [error, setError]             = useState<string | null>(null);

  const partialTextRef = useRef('');
  const processedRef   = useRef(false);
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** transcribeRealtime の stop 関数 */
  const nativeStopRef  = useRef<(() => Promise<void>) | null>(null);
  /** 診断用イベントカウント */
  const eventCountRef  = useRef(0);

  const voiceLang        = useSettingsStore((s) => s.voiceLang);
  const applyVoiceResult = useCalculatorStore((s) => s.applyVoiceResult);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const processAndApply = useCallback(
    (text: string) => {
      if (processedRef.current) return;
      processedRef.current = true;
      clearTimer();

      if (!text.trim()) {
        setError(`空結果 (events=${eventCountRef.current})`);
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

  const stopListening = useCallback(() => {
    clearTimer();
    if (nativeStopRef.current) {
      void nativeStopRef.current();
      nativeStopRef.current = null;
    }
    // native stop 後に onFinalResult が呼ばれるので、
    // そこで processAndApply が走る。ただし即座に呼ばれない場合の保険:
    setTimeout(() => {
      processAndApply(partialTextRef.current);
    }, 500);
  }, [processAndApply, clearTimer]);

  const startListening = useCallback(async () => {
    try {
      // ── リセット ──────────────────────────────────────
      setError(null);
      setPartialText('');
      setFinalText('');
      partialTextRef.current = '';
      processedRef.current   = false;
      eventCountRef.current  = 0;
      nativeStopRef.current  = null;

      setVoiceState('requesting_permission');

      // ── マイク権限 ─────────────────────────────────────
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setVoiceState('idle');
        setError('マイク権限が必要です');
        return;
      }

      setVoiceState('listening');

      // ── 30 秒タイムアウト ─────────────────────────────
      timeoutRef.current = setTimeout(() => {
        if (nativeStopRef.current) {
          void nativeStopRef.current();
          nativeStopRef.current = null;
        }
        processAndApply(partialTextRef.current);
      }, TIMEOUT_MS);

      // ── WhisperManager 自動初期化 ────────────────────
      const manager = WhisperManager.getInstance();
      const { activeModelId, downloadedModels } = useModelStore.getState();
      const modelPath = downloadedModels.includes(activeModelId)
        ? getLocalModelPath(activeModelId)
        : null;

      if (modelPath) {
        const fileInfo = await FileSystem.getInfoAsync(modelPath);
        if (!fileInfo.exists) {
          clearTimer();
          setError(`モデルファイル不在: ${activeModelId}`);
          setVoiceState('idle');
          return;
        }
      }

      if (!manager.isReady()) {
        if (!modelPath) {
          clearTimer();
          setError(`モデル未DL (active=${activeModelId})`);
          setVoiceState('idle');
          return;
        }
        try {
          await manager.initialize(modelPath);
        } catch (initErr) {
          clearTimer();
          setError(`初期化失敗: ${initErr instanceof Error ? initErr.message : String(initErr)}`);
          setVoiceState('idle');
          return;
        }
      }

      if (!manager.isReady()) {
        clearTimer();
        setError('whisper.rn未リンク');
        setVoiceState('idle');
        return;
      }

      // ── transcribeRealtime（audioSessionOnStartIos で録音セッション設定）──
      const ctx = manager.getContext();
      try {
        const { stop, subscribe } = await ctx.transcribeRealtime({
          language: voiceLang === 'auto' ? undefined : voiceLang,
          realtimeAudioSec: 30,
          // whisper.rn 自身に iOS AudioSession を PlayAndRecord に設定させる
          audioSessionOnStartIos: {
            category: 'PlayAndRecord',
            options: ['DefaultToSpeaker', 'AllowBluetooth'],
            mode: 'Default',
            active: true,
          },
          audioSessionOnStopIos: 'restore',
        });

        nativeStopRef.current = stop;

        subscribe((event: any) => {
          eventCountRef.current++;
          const code: number = event.code ?? 0;
          const text: string = event.data?.result ?? '';

          if (!event.isCapturing) {
            // ストリーミング完了（stop押下 or バッファ満杯）
            // code -999 = ユーザーstopによるabort → パーシャルテキストを使う
            const finalText = (code === -999 || !text.trim())
              ? partialTextRef.current
              : text;
            processAndApply(finalText);
          } else if (event.error) {
            // キャプチャ中のエラー（致命的ではない、次のスライスで回復する可能性）
            // code -999 は中断なので無視
            if (code !== -999) {
              setPartialText(`[err: ${event.error}]`);
            }
          } else if (text.trim()) {
            setPartialText(text);
            partialTextRef.current = text;
          }
        });
      } catch (rtErr) {
        clearTimer();
        setError(`realtime失敗: ${rtErr instanceof Error ? rtErr.message : String(rtErr)}`);
        setVoiceState('idle');
      }
    } catch (_err) {
      setError('録音を開始できませんでした');
      setVoiceState('idle');
    }
  }, [voiceLang, processAndApply, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (nativeStopRef.current) {
        void nativeStopRef.current();
        nativeStopRef.current = null;
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
