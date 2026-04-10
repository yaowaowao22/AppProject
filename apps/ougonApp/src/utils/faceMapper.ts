import { Point, FaceLandmarks, PhiDeviations } from '../types/face';

function euclidean(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * 制御点がランドマーク近傍にある場合、deltaPixels × intensity に基づく
 * 補正ベクトル (dx, dy) を返す。影響半径はランドマーク間距離の 0.3 倍。
 * 近傍外の点は {dx:0, dy:0}。
 */
export function calcCorrection(
  point: Point,
  deviations: PhiDeviations,
  landmarks: FaceLandmarks,
  intensity: number,
): { dx: number; dy: number } {
  const pt = point ?? { x: 0, y: 0 };
  const safeIntensity = intensity ?? 0;
  const lm = landmarks ?? ({} as FaceLandmarks);
  const dev = deviations ?? ({} as PhiDeviations);

  const leftEye = lm.leftEyePosition ?? { x: 0, y: 0 };
  const rightEye = lm.rightEyePosition ?? { x: 0, y: 0 };
  const noseBase = lm.noseBasePosition ?? { x: 0, y: 0 };
  const bottomMouth = lm.bottomMouthPosition ?? { x: 0, y: 0 };

  // 影響半径の基準: 目幅 × 0.3
  const eyeDist = euclidean(leftEye, rightEye) || 1;
  const influenceRadius = eyeDist * 0.3;

  // 各ランドマーク近傍への補正ベクトル定義
  const corrections: Array<{ anchor: Point; dx: number; dy: number }> = [
    // faceAspect: 顎を上下にシフトして縦横比を補正
    {
      anchor: bottomMouth,
      dx: 0,
      dy: (dev.faceAspect?.deltaPixels ?? 0) * safeIntensity,
    },
    // eyeToFace: 左目を左へ、右目を右へシフトして目幅を補正
    {
      anchor: leftEye,
      dx: -(dev.eyeToFace?.deltaPixels ?? 0) * 0.5 * safeIntensity,
      dy: 0,
    },
    {
      anchor: rightEye,
      dx: (dev.eyeToFace?.deltaPixels ?? 0) * 0.5 * safeIntensity,
      dy: 0,
    },
    // noseRatio: 鼻根部を垂直方向にシフトして眉間〜顎比を補正
    {
      anchor: noseBase,
      dx: 0,
      dy: (dev.noseRatio?.deltaPixels ?? 0) * safeIntensity,
    },
  ];

  let sumDx = 0;
  let sumDy = 0;
  let sumWeight = 0;

  for (const { anchor, dx, dy } of corrections) {
    const d = euclidean(pt, anchor);
    if (d >= influenceRadius) continue;
    // ガウス減衰: 影響半径の端で重みが ~0 に収束
    const sigma = influenceRadius * 0.5;
    const weight = Math.exp(-0.5 * (d / sigma) ** 2);
    sumDx += dx * weight;
    sumDy += dy * weight;
    sumWeight += weight;
  }

  if (sumWeight <= 0) return { dx: 0, dy: 0 };

  return {
    dx: sumDx / sumWeight,
    dy: sumDy / sumWeight,
  };
}

/**
 * cols × rows の均等グリッド制御点配列を生成する。
 * 各辺の端点を含む (0 〜 width, 0 〜 height)。
 */
export function buildGrid(
  width: number,
  height: number,
  cols: number,
  rows: number,
): Point[] {
  const w = width ?? 0;
  const h = height ?? 0;
  const c = Math.max(cols ?? 2, 2);
  const r = Math.max(rows ?? 2, 2);

  const points: Point[] = [];
  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      points.push({
        x: (w * col) / (c - 1),
        y: (h * row) / (r - 1),
      });
    }
  }
  return points;
}
