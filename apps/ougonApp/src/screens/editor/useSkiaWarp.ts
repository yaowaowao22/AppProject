import { useMemo, useState } from 'react';
import { FaceLandmarks, PhiDeviations, WarpMesh } from '../../types/face';
import { buildGrid, calcCorrection } from '../../utils/faceMapper';

export type PartAdjustments = {
  eyeSpacing: number;    // -20 ~ +20 px: 目間距離（左右対称に外/内側へシフト）
  jawLine: number;       // -20 ~ +20 px: 顎先を上下にシフト
  noseWidth: number;     // -20 ~ +20 px: 鼻幅（左右対称に外/内側へシフト）
  mouthPosition: number; // -20 ~ +20 px: 口の縦位置をシフト
};

/** WarpMesh に Skia Vertices 用の三角形インデックスを追加した型 */
export type WarpMeshWithIndices = WarpMesh & { indices: number[] };

export type UseSkiaWarpResult = {
  warpMesh: WarpMeshWithIndices | null;
  intensity: number;
  setIntensity: (v: number) => void;
  partAdjustments: PartAdjustments;
  setPartAdjustment: (key: string, value: number) => void;
  resetAll: () => void;
};

const COLS = 8;
const ROWS = 10;
const DEFAULT_INTENSITY = 70;
const DEFAULT_PART_ADJUSTMENTS: PartAdjustments = {
  eyeSpacing: 0,
  jawLine: 0,
  noseWidth: 0,
  mouthPosition: 0,
};

/**
 * cols × rows グリッドを三角形分割した indices 配列を返す。
 * 各クワッドを右下対角線で2三角形に分割する。
 */
function buildTriangleIndices(cols: number, rows: number): number[] {
  const indices: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const tl = r * cols + c;
      const tr = r * cols + c + 1;
      const bl = (r + 1) * cols + c;
      const br = (r + 1) * cols + c + 1;
      indices.push(tl, tr, bl);
      indices.push(tr, br, bl);
    }
  }
  return indices;
}

/**
 * partAdjustments を制御点の (dx, dy) オフセットに変換する。
 * 各調整は顔の部位に対応する y 範囲にのみ作用し、範囲端でゼロに収束する。
 */
function partAdjustmentOffset(
  point: { x: number; y: number },
  imageWidth: number,
  imageHeight: number,
  adj: PartAdjustments,
): { dx: number; dy: number } {
  const ny = imageHeight > 0 ? point.y / imageHeight : 0;
  const cx = imageWidth * 0.5;
  let dx = 0;
  let dy = 0;

  // 目間距離: y ≈ 0.30–0.45、左半面→内向き負、右半面→内向き正
  if (ny >= 0.30 && ny <= 0.45) {
    const weight = 1 - Math.abs((ny - 0.375) / 0.075);
    const side = point.x < cx ? -1 : 1;
    dx += adj.eyeSpacing * Math.max(0, weight) * side;
  }
  // 鼻幅: y ≈ 0.45–0.60、左右対称に外/内側へシフト
  if (ny >= 0.45 && ny <= 0.60) {
    const weight = 1 - Math.abs((ny - 0.525) / 0.075);
    const side = point.x < cx ? -1 : 1;
    dx += adj.noseWidth * Math.max(0, weight) * side;
  }
  // 口の縦位置: y ≈ 0.60–0.75、垂直シフト
  if (ny >= 0.60 && ny <= 0.75) {
    const weight = 1 - Math.abs((ny - 0.675) / 0.075);
    dy += adj.mouthPosition * Math.max(0, weight);
  }
  // 顎先: y ≈ 0.75–1.00、下方ほど強く垂直シフト
  if (ny >= 0.75 && ny <= 1.0) {
    const weight = (ny - 0.75) / 0.25;
    dy += adj.jawLine * weight;
  }

  return { dx, dy };
}

export function useSkiaWarp(
  deviations: PhiDeviations | null,
  imageWidth: number,
  imageHeight: number,
): UseSkiaWarpResult {
  const [intensity, setIntensityState] = useState<number>(DEFAULT_INTENSITY);
  const [partAdjustments, setPartAdjustmentsState] = useState<PartAdjustments>(
    { ...DEFAULT_PART_ADJUSTMENTS },
  );

  const setIntensity = (v: number) => {
    setIntensityState(Math.round(Math.max(0, Math.min(100, v))));
  };

  const setPartAdjustment = (key: string, value: number) => {
    if (!(key in DEFAULT_PART_ADJUSTMENTS)) return;
    setPartAdjustmentsState(prev => ({
      ...prev,
      [key]: Math.max(-20, Math.min(20, value)),
    }));
  };

  const resetAll = () => {
    setIntensityState(DEFAULT_INTENSITY);
    setPartAdjustmentsState({ ...DEFAULT_PART_ADJUSTMENTS });
  };

  const warpMesh = useMemo<WarpMeshWithIndices | null>(() => {
    if (!deviations) return null;

    const w = imageWidth > 0 ? imageWidth : 1;
    const h = imageHeight > 0 ? imageHeight : 1;

    const sourcePoints = buildGrid(w, h, COLS, ROWS);

    // ランドマーク未取得時の仮想座標（正面ポートレートの標準比率から推定）
    const virtualLandmarks: FaceLandmarks = {
      leftEyePosition:  { x: w * 0.35, y: h * 0.38 },
      rightEyePosition: { x: w * 0.65, y: h * 0.38 },
      noseBasePosition: { x: w * 0.50, y: h * 0.55 },
      bottomMouthPosition: { x: w * 0.50, y: h * 0.65 },
      leftEarPosition:  { x: w * 0.10, y: h * 0.45 },
      rightEarPosition: { x: w * 0.90, y: h * 0.45 },
      leftCheekPosition:  { x: w * 0.25, y: h * 0.55 },
      rightCheekPosition: { x: w * 0.75, y: h * 0.55 },
    };

    const normalizedIntensity = intensity / 100;

    const destPoints = sourcePoints.map(src => {
      const { dx: cdx, dy: cdy } = calcCorrection(
        src,
        deviations,
        virtualLandmarks,
        normalizedIntensity,
      );
      const { dx: adx, dy: ady } = partAdjustmentOffset(src, w, h, partAdjustments);
      return {
        x: src.x + cdx + adx,
        y: src.y + cdy + ady,
      };
    });

    const indices = buildTriangleIndices(COLS, ROWS);

    return { sourcePoints, destPoints, indices };
  }, [deviations, imageWidth, imageHeight, intensity, partAdjustments]);

  return {
    warpMesh,
    intensity,
    setIntensity,
    partAdjustments,
    setPartAdjustment,
    resetAll,
  };
}
