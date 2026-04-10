import { useMemo } from 'react';
import { FaceLandmarks, PhiDeviations } from '../../types/face';
import { calcDeviations } from '../../utils/goldenRatio';

export interface UseGoldenRatioResult {
  deviations: PhiDeviations | null;
  loading: boolean;
}

export function useGoldenRatio(
  landmarks: FaceLandmarks | null,
  imageWidth: number,
  imageHeight: number,
): UseGoldenRatioResult {
  // landmarks/imageWidth/imageHeight が変わった時のみ再計算
  const deviations = useMemo<PhiDeviations | null>(() => {
    // null の場合は計算不要（Nullish coalescing で防御）
    if (landmarks == null) return null;
    try {
      return calcDeviations(landmarks, imageWidth ?? 0, imageHeight ?? 0);
    } catch {
      return null;
    }
  }, [landmarks, imageWidth, imageHeight]);

  // calcDeviations は同期処理なので loading は常に false
  return { deviations: deviations ?? null, loading: false };
}
