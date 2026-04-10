import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

      // Actions
      setAngleUnit:      (u) => set({ angleUnit: u }),
      setDecimals:       (d) => set({ decimals: d }),
      setUseThousandSep: (v) => set({ useThousandSep: v }),
      setUseExpNotation: (v) => set({ useExpNotation: v }),
      setHaptics:        (v) => set({ haptics: v }),
      setSoundFeedback:  (v) => set({ soundFeedback: v }),
      setVoiceLang:      (l) => set({ voiceLang: l }),
      setVoiceReadback:  (v) => set({ voiceReadback: v }),
      setActiveModel:    (id) => set({ activeModelId: id }),
    }),
    {
      name:    'dentak-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
