/** 2D座標点（ランドマーク座標・変形制御点に共用） */
export type Point = {
  x: number;
  y: number;
};

/** expo-face-detector が返す顔ランドマーク座標セット */
export interface FaceLandmarks {
  /** 左目中心座標 */
  leftEyePosition: Point;
  /** 右目中心座標 */
  rightEyePosition: Point;
  /** 鼻根部（鼻の付け根）座標 */
  noseBasePosition: Point;
  /** 下唇中央座標 */
  bottomMouthPosition: Point;
  /** 左耳座標（顔幅計算に使用） */
  leftEarPosition: Point;
  /** 右耳座標（顔幅計算に使用） */
  rightEarPosition: Point;
  /** 左頬座標（顔輪郭幅計算に使用） */
  leftCheekPosition: Point;
  /** 右頬座標（顔輪郭幅計算に使用） */
  rightCheekPosition: Point;
}

/** 各部位における黄金比（φ）からの乖離量と補正スコア */
export interface PhiDeviation {
  /** 部位名（例: "顔の縦横比", "目幅/顔幅"） */
  label: string;
  /** 実測比率 */
  actual: number;
  /** φ目標値（例: 1.618、0.382） */
  target: number;
  /** 補正に必要なピクセル量（正=拡大方向、負=縮小方向） */
  deltaPixels: number;
  /** 0–100 のφ適合度スコア（100が完全一致） */
  score: number;
}

/** calcDeviations() が返す5部位のφ乖離セット + 総合スコア */
export interface PhiDeviations {
  /** 顔の縦横比（目標: φ = 1.618） */
  faceAspect: PhiDeviation;
  /** 目幅/顔幅比（目標: 1/φ² = 0.382） */
  eyeToFace: PhiDeviation;
  /** 鼻幅/口幅比（目標: 1/φ = 0.618） */
  noseToMouth: PhiDeviation;
  /** 眉間〜鼻先 / 鼻先〜顎 比（目標: φ） */
  noseRatio: PhiDeviation;
  /** 顔幅/目幅比（目標: φ² = 2.618） */
  faceToEye: PhiDeviation;
  /** 0–100 の加重平均スコア（全5項目を統合した総合φ適合度） */
  totalScore: number;
}

/** Skia Mesh Warp で使う変形制御点ペア */
export type WarpMesh = {
  /** 元画像の制御点グリッド（例: 8×10 = 80点） */
  sourcePoints: Point[];
  /** φ補正を適用した変形先制御点（intensity 乗算済み） */
  destPoints: Point[];
};
