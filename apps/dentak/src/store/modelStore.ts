import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WhisperModelSize } from '../whisper/modelRegistry';

export type { WhisperModelSize };

type DownloadProgress = Record<WhisperModelSize, number | null>;

const ALL_SIZES: WhisperModelSize[] = ['tiny', 'base', 'small', 'medium'];

const INITIAL_PROGRESS: DownloadProgress = {
  tiny:   null,
  base:   null,
  small:  null,
  medium: null,
};

export interface ModelState {
  activeModelId:    WhisperModelSize;
  downloadedModels: WhisperModelSize[];
  downloadProgress: DownloadProgress;
  isLoading:        boolean;

  // Actions
  setActiveModel: (id: WhisperModelSize) => void;
  startDownload:  (id: WhisperModelSize) => Promise<void>;
  deleteModel:    (id: WhisperModelSize) => Promise<void>;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      activeModelId:    'tiny',
      downloadedModels: [],
      downloadProgress: { ...INITIAL_PROGRESS },
      isLoading:        false,

      setActiveModel: (id) => {
        set({ activeModelId: id });
      },

      // スタブ: expo-file-system の createDownloadResumable() 実装前の段階モック
      // Stage 3 で WhisperManager との統合後に本実装に差し替え
      startDownload: async (id) => {
        const { downloadedModels, downloadProgress } = get();
        if (downloadedModels.includes(id)) return;
        if (downloadProgress[id] !== null) return; // DL中

        // 0 → 1 を 10ステップで疑似進捗更新
        set((s) => ({
          downloadProgress: { ...s.downloadProgress, [id]: 0 },
        }));

        const STEPS = 10;
        for (let i = 1; i <= STEPS; i++) {
          await new Promise<void>((resolve) => setTimeout(resolve, 200));
          set((s) => ({
            downloadProgress: { ...s.downloadProgress, [id]: i / STEPS },
          }));
        }

        set((s) => ({
          downloadedModels: [...s.downloadedModels, id],
          downloadProgress: { ...s.downloadProgress, [id]: null },
        }));
      },

      // スタブ: expo-file-system でのファイル削除は Stage 3 で実装
      deleteModel: async (id) => {
        if (id === 'tiny') return; // tiny は削除不可（起動必須モデル）
        set((s) => ({
          downloadedModels: s.downloadedModels.filter((m) => m !== id),
          downloadProgress: { ...s.downloadProgress, [id]: null },
          // 削除したモデルが使用中なら tiny にフォールバック
          activeModelId: s.activeModelId === id ? 'tiny' : s.activeModelId,
        }));
      },
    }),
    {
      name:    'dentak-model-state',
      storage: createJSONStorage(() => AsyncStorage),
      // downloadProgress は一時状態のため永続化対象外
      partialize: (s) => ({
        activeModelId:    s.activeModelId,
        downloadedModels: s.downloadedModels,
      }),
    },
  ),
);

/** 派生セレクタ: whisper-tiny がダウンロード済みかどうか */
export const useTinyReady = (): boolean =>
  useModelStore((s) => s.downloadedModels.includes('tiny'));
