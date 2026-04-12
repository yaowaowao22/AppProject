import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyLayout, LayoutRow, PresetName } from '../config/keyLayouts';
import {
  PRESET_EXTENDED,
  UTIL_BAR_PRESETS,
  PRESETS,
  cloneLayout,
  validateLayout,
} from '../config/keyLayouts';

// WhisperModelSize は src/whisper/modelRegistry.ts 実装後にそちらからimportに差し替え:
// import type { WhisperModelSize } from '../whisper/modelRegistry';
/** @todo modelRegistry実装後にimportに差し替え */
export type WhisperModelSize = 'tiny' | 'base' | 'small' | 'medium';

export type AngleUnit    = 'deg' | 'rad' | 'grad';
export type DecimalMode  = 'auto' | 4 | 8;
export type VoiceLang    = 'ja' | 'en' | 'auto';

export interface SettingsStore {
  // 表示・計算設定
  angleUnit:      AngleUnit;
  decimals:       DecimalMode;
  useThousandSep: boolean;
  useExpNotation: boolean;

  // 操作フィードバック
  haptics:        boolean;
  soundFeedback:  boolean;

  // 音声認識設定
  voiceLang:      VoiceLang;
  voiceReadback:  boolean;
  activeModelId:  WhisperModelSize;

  // キーレイアウト
  /** 数字キーグリッド（完全カスタマイズ可能な2Dグリッド） */
  numLayout:      KeyLayout;
  /** ユーティリティバー（上部の小ボタン列） */
  utilLayout:     LayoutRow;

  // Actions
  setAngleUnit:      (u: AngleUnit) => void;
  setDecimals:       (d: DecimalMode) => void;
  setUseThousandSep: (v: boolean) => void;
  setUseExpNotation: (v: boolean) => void;
  setHaptics:        (v: boolean) => void;
  setSoundFeedback:  (v: boolean) => void;
  setVoiceLang:      (l: VoiceLang) => void;
  setVoiceReadback:  (v: boolean) => void;
  setActiveModel:    (id: WhisperModelSize) => void;

  // レイアウト actions
  /** プリセットを適用（numLayout + utilLayout を一括上書き） */
  applyPreset:       (name: PresetName) => void;
  /** 数字グリッドの特定セルのキーを差し替え */
  setNumKey:         (rowIdx: number, colIdx: number, keyId: string) => void;
  /** 数字グリッドの2つのキーを入れ替え */
  swapNumKeys:       (r1: number, c1: number, r2: number, c2: number) => void;
  /** ユーティリティバーの特定セルのキーを差し替え */
  setUtilKey:        (colIdx: number, keyId: string) => void;
  /** レイアウト全体を直接セット */
  setNumLayout:      (layout: KeyLayout) => void;
  setUtilLayout:     (layout: LayoutRow) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // デフォルト値
      angleUnit:      'deg',
      decimals:       'auto',
      useThousandSep: true,
      useExpNotation: true,
      haptics:        true,
      soundFeedback:  false,
      voiceLang:      'ja',
      voiceReadback:  false,
      activeModelId:  'tiny',

      // デフォルトレイアウト: extended (現行互換)
      numLayout:  cloneLayout(PRESET_EXTENDED),
      utilLayout: [...UTIL_BAR_PRESETS.extended],

      // Actions
      setAngleUnit:      (u: AngleUnit) => set({ angleUnit: u }),
      setDecimals:       (d: DecimalMode) => set({ decimals: d }),
      setUseThousandSep: (v: boolean) => set({ useThousandSep: v }),
      setUseExpNotation: (v: boolean) => set({ useExpNotation: v }),
      setHaptics:        (v: boolean) => set({ haptics: v }),
      setSoundFeedback:  (v: boolean) => set({ soundFeedback: v }),
      setVoiceLang:      (l: VoiceLang) => set({ voiceLang: l }),
      setVoiceReadback:  (v: boolean) => set({ voiceReadback: v }),
      setActiveModel:    (id: WhisperModelSize) => set({ activeModelId: id }),

      // レイアウト actions
      applyPreset: (name: PresetName) => {
        const preset = PRESETS[name];
        const util   = UTIL_BAR_PRESETS[name];
        if (!preset || !util) return;
        set({
          numLayout:  cloneLayout(preset),
          utilLayout: util.map((c: { keyId: string; flex?: number }) => ({ ...c })),
        });
      },

      setNumKey: (rowIdx: number, colIdx: number, keyId: string) => {
        set((s: SettingsStore) => {
          const next = cloneLayout(s.numLayout);
          if (next[rowIdx]?.[colIdx]) {
            next[rowIdx][colIdx] = { ...next[rowIdx][colIdx], keyId };
          }
          return { numLayout: next };
        });
      },

      swapNumKeys: (r1: number, c1: number, r2: number, c2: number) => {
        set((s: SettingsStore) => {
          const next = cloneLayout(s.numLayout);
          const a = next[r1]?.[c1];
          const b = next[r2]?.[c2];
          if (!a || !b) return {};
          const tmpId = a.keyId;
          a.keyId = b.keyId;
          b.keyId = tmpId;
          return { numLayout: next };
        });
      },

      setUtilKey: (colIdx: number, keyId: string) => {
        set((s: SettingsStore) => {
          const next = s.utilLayout.map((c: { keyId: string; flex?: number }) => ({ ...c }));
          if (next[colIdx]) {
            next[colIdx] = { ...next[colIdx], keyId };
          }
          return { utilLayout: next };
        });
      },

      setNumLayout:  (layout: KeyLayout) => set({ numLayout: cloneLayout(layout) }),
      setUtilLayout: (layout: LayoutRow) => set({ utilLayout: layout.map((c: { keyId: string; flex?: number }) => ({ ...c })) }),
    }),
    {
      name:    'dentak-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // numLayout / utilLayout のバリデーション: 不正データ時はデフォルトにフォールバック
      merge: (persisted: any, current: any) => {
        const merged = { ...current, ...persisted };
        if (!merged.numLayout || !Array.isArray(merged.numLayout) || !validateLayout(merged.numLayout)) {
          merged.numLayout  = cloneLayout(PRESET_EXTENDED);
          merged.utilLayout = [...UTIL_BAR_PRESETS.extended];
        }
        return merged;
      },
    },
  ),
);
