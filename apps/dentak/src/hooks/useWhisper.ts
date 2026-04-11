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
import { StreamingSession } from '../whisper/StreamingSession';
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
  const recordingRef   = useRef<Audio.Recording | null>(null);
  const partialTextRef = useRef('');
  /** 二重実行防止フラグ: onFinalResult / stopListening / timeout の競合を抑制 */
  const processedRef   = useRef(false);
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voiceLang       = useSettingsStore((s) => s.voiceLang);
  const applyVoiceResult = useCalculatorStore((s) => s.applyVoiceResult);

  // stopListening を ref 経由でタイムアウトから参照（useCallback の依存循環を避ける）
  const stopListeningRef = useRef<() => Promise<void>>(async () => {});

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

      // 空文字 = Whisper が何も認識できなかった → セッション診断付きエラー
      if (!text.trim()) {
        const diag = sessionRef.current?.getDiag() ?? 'session=null';
        setError(`空結果 [${diag}]`);
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

  /** 手動停止: 録音停止 → whisper.rn transcribe → 結果を反映 */
  const stopListening = useCallback(async () => {
    clearTimer();

    const recording = recordingRef.current;
    recordingRef.current = null;

    if (!recording) {
      processAndApply(partialTextRef.current);
      return;
    }

    try {
      setVoiceState('processing');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        setError('録音ファイルが見つかりません');
        setVoiceState('idle');
        return;
      }

      // whisper.rn の file transcribe で認識
      const manager = WhisperManager.getInstance();
      const ctx = manager.getContext();
      if (!ctx || typeof ctx.transcribe !== 'function') {
        setError(`transcribe未対応 (ctx=${!!ctx})`);
        setVoiceState('idle');
        return;
      }

      const { promise } = ctx.transcribe(uri, {
        language: voiceLang === 'auto' ? undefined : voiceLang,
      });
      const result = await promise;
      const text = result?.data?.result?.trim() ?? '';

      processAndApply(text);
    } catch (err) {
      setError(`認識失敗: ${err instanceof Error ? err.message : String(err)}`);
      setVoiceState('idle');
    }
  }, [voiceLang, processAndApply, clearTimer]);

  // ref を最新の stopListening に同期（タイムアウト用）
  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

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
        // タイムアウト時は stopListening を直接呼ぶ（録音停止→transcribe）
        void stopListeningRef.current();
      }, TIMEOUT_MS);

      // ── WhisperManager 未初期化時の自動初期化 ────────────
      const manager = WhisperManager.getInstance();
      const { activeModelId, downloadedModels } = useModelStore.getState();
      const modelPath = downloadedModels.includes(activeModelId)
        ? getLocalModelPath(activeModelId)
        : null;

      // モデルファイル実在チェック
      if (modelPath) {
        const fileInfo = await FileSystem.getInfoAsync(modelPath);
        if (!fileInfo.exists) {
          clearTimer();
          setError(`モデルファイル不在: ${activeModelId} @ ${modelPath}`);
          setVoiceState('idle');
          return;
        }
      }

      if (!manager.isReady()) {
        if (!modelPath) {
          clearTimer();
          setError(`モデル未DL (models=${JSON.stringify(downloadedModels)}, active=${activeModelId})`);
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
        setError(`whisper.rn未リンク (model=${activeModelId}, path=${modelPath ?? 'none'})`);
        setVoiceState('idle');
        return;
      }

      // ── 録音＋認識（expo-av録音 → whisper.rn file transcribe） ──
      // transcribeRealtime が AVAudioEngine 起動に失敗するため、
      // expo-av で録音 → ファイルを whisper.rn の transcribe() に渡す方式にフォールバック
      try {
        const recording = new Audio.Recording();
        recordingRef.current = recording;
        await recording.prepareToRecordAsync({
          isMeteringEnabled: false,
          android: {
            extension: '.wav',
            outputFormat: 3, // THREE_GPP -> PCM container
            audioEncoder: 1, // DEFAULT
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
          },
          ios: {
            extension: '.wav',
            outputFormat: 'linearPCM' as any,
            audioQuality: 127, // MAX
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        });
        await recording.startAsync();
      } catch (recErr) {
        clearTimer();
        setError(`録音開始失敗: ${recErr instanceof Error ? recErr.message : String(recErr)}`);
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
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
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
