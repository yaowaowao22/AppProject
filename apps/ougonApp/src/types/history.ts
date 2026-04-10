import type { PhiDeviations } from './face';

/** AsyncStorage に永続化される加工履歴の1レコード */
export interface HistoryRecord {
  /** UUID等の一意識別子 */
  id: string;
  /** 加工日時（ISO8601形式、例: "2026-04-11T10:30:00.000Z"） */
  createdAt: string;
  /** ユーザーが付けた名前または自動生成ラベル（例: "自撮り"） */
  label: string;
  /** expo-file-system のサムネイル画像ローカルパス */
  thumbnailPath: string;
  /** expo-file-system の加工済み画像ローカルパス */
  processedPath: string;
  /** 0–100 のφ適合度スコア */
  score: number;
  /** 0–100 の補正強度（スライダー値） */
  intensity: number;
  /** 保存時点での各部位φ乖離データ */
  deviations: PhiDeviations;
}
