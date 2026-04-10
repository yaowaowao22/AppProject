// ══════════════════════════════════════════════
// 無音の演算 — useModelManager
// モデル状態・DL進捗・ファイル操作・WhisperManager 切り替えを統合管理
// ══════════════════════════════════════════════

import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import {
  MODEL_REGISTRY,
  getModel,
  getLocalModelPath,
} from '../whisper/modelRegistry';
import type { WhisperModel, WhisperModelSize } from '../whisper/modelRegistry';
import { useModelStore, useTinyReady } from '../store/modelStore';
import WhisperManager from '../whisper/WhisperManager';

/** MODEL_REGISTRY に UI 向けのダウンロード状態をマージした型 */
export interface AvailableModel extends WhisperModel {
  /** ダウンロード済みで使用可能か */
  isDownloaded: boolean;
  /** DL 中は 0–1、それ以外は null */
  progress:     number | null;
}

export interface UseModelManagerReturn {
  /** MODEL_REGISTRY に downloadedModels / downloadProgress をマージした配列 */
  availableModels:  AvailableModel[];
  /** いずれかのモデルが DL 中か */
  isDownloading:    boolean;
  /** tiny モデルが使用可能か（起動必須モデル） */
  tinyReady:        boolean;
  /**
   * モバイル通信（非 WiFi）で downloadModel が呼ばれた際に true になる。
   * UI 側で警告ダイアログを表示する用途。DL 自体はブロックしない。
   */
  needsWifiWarning: boolean;
  downloadModel:    (id: WhisperModelSize) => Promise<void>;
  deleteModel:      (id: WhisperModelSize) => Promise<void>;
  switchModel:      (id: WhisperModelSize) => Promise<void>;
}

export function useModelManager(): UseModelManagerReturn {
  const downloadedModels = useModelStore((s) => s.downloadedModels);
  const downloadProgress = useModelStore((s) => s.downloadProgress);
  const setActiveModel   = useModelStore((s) => s.setActiveModel);
  const storeDeleteModel = useModelStore((s) => s.deleteModel);
  const tinyReady        = useTinyReady();

  const [needsWifiWarning, setNeedsWifiWarning] = useState(false);

  // ── 派生値 ──────────────────────────────────────────────
  const availableModels: AvailableModel[] = MODEL_REGISTRY.map((m) => ({
    ...m,
    isDownloaded: downloadedModels.includes(m.id),
    progress:     downloadProgress[m.id] ?? null,
  }));

  const isDownloading = MODEL_REGISTRY.some(
    (m) => downloadProgress[m.id] !== null,
  );

  // ── downloadModel ────────────────────────────────────────
  /**
   * expo-file-system の createDownloadResumable でダウンロードを実行する。
   * 進捗は modelStore.downloadProgress にリアルタイム反映。
   * モバイル通信時は needsWifiWarning を true にセットしてから DL を継続する。
   *
   * ⚠️ useModelStore.setState() で downloadProgress を直接更新するため
   * store の startDownload（疑似モック）は呼ばない。
   */
  const downloadModel = useCallback(async (id: WhisperModelSize) => {
    // ストアから最新値を取得（async 処理中でも stale にならないように getState()）
    const { downloadedModels: dl, downloadProgress: dp } =
      useModelStore.getState();
    if (dl.includes(id)) return;    // 既にダウンロード済み
    if (dp[id] !== null) return;    // DL 中

    // ── ネットワーク種別チェック ──────────────────────────
    const netState = await NetInfo.fetch();
    setNeedsWifiWarning(netState.type !== 'wifi');

    // 進捗を 0 に初期化
    useModelStore.setState((s) => ({
      downloadProgress: { ...s.downloadProgress, [id]: 0 },
    }));

    const model    = getModel(id);
    const destPath = getLocalModelPath(id);

    // 保存先ディレクトリを確保
    const dir = destPath.substring(0, destPath.lastIndexOf('/'));
    try {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    } catch {
      // 既存ディレクトリの場合は無視
    }

    // ── ダウンロード実行 ──────────────────────────────────
    try {
      const resumable = FileSystem.createDownloadResumable(
        model.ggmlUrl,
        destPath,
        {},
        (dlProgress) => {
          const ratio =
            dlProgress.totalBytesExpectedToWrite > 0
              ? dlProgress.totalBytesWritten / dlProgress.totalBytesExpectedToWrite
              : 0;
          useModelStore.setState((s) => ({
            downloadProgress: { ...s.downloadProgress, [id]: ratio },
          }));
        },
      );

      await resumable.downloadAsync();

      // 完了: downloadedModels に追加、進捗をリセット
      useModelStore.setState((s) => ({
        downloadedModels: [...s.downloadedModels, id],
        downloadProgress: { ...s.downloadProgress, [id]: null },
      }));
    } catch (err) {
      // 失敗: 進捗リセットのみ（ファイルが残っていれば次回 DL で上書き）
      useModelStore.setState((s) => ({
        downloadProgress: { ...s.downloadProgress, [id]: null },
      }));
      throw err;
    }
  }, []);

  // ── deleteModel ──────────────────────────────────────────
  /**
   * expo-file-system でファイルを削除してから modelStore を更新する。
   * tiny は modelStore 側でガードされているため削除不可。
   * ファイル削除に失敗してもストア更新は続行する（不整合よりは使用不可の方が安全）。
   */
  const deleteModel = useCallback(
    async (id: WhisperModelSize) => {
      const path = getLocalModelPath(id);
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          await FileSystem.deleteAsync(path, { idempotent: true });
        }
      } catch {
        // ファイル操作失敗 — ストア更新は続行
      }
      await storeDeleteModel(id);
    },
    [storeDeleteModel],
  );

  // ── switchModel ──────────────────────────────────────────
  /**
   * WhisperManager を再初期化してアクティブモデルを切り替える。
   * 切り替え順: release → initialize(新モデルパス) → setActiveModel
   * ⚠️ 切り替え中は WhisperManager が利用不可になるため呼び出し側で制御が必要。
   */
  const switchModel = useCallback(
    async (id: WhisperModelSize) => {
      const manager   = WhisperManager.getInstance();
      const modelPath = getLocalModelPath(id);
      await manager.release();
      await manager.initialize(modelPath);
      setActiveModel(id);
    },
    [setActiveModel],
  );

  return {
    availableModels,
    isDownloading,
    tinyReady,
    needsWifiWarning,
    downloadModel,
    deleteModel,
    switchModel,
  };
}
