import { useState, useCallback, useEffect } from 'react';
import { manipulateAsync } from 'expo-image-manipulator';
import { FaceLandmarks } from '../../types/face';

export interface UseFaceDetectResult {
  landmarks: FaceLandmarks | null;
  imageWidth: number;
  imageHeight: number;
  loading: boolean;
  error: string | null;
  detectFace: (uri: string) => Promise<void>;
}

export function useFaceDetect(imageUri: string | null): UseFaceDetectResult {
  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const detectFace = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    setLandmarks(null);

    try {
      // 画像サイズ取得（空アクション配列でメタ情報のみ取得）
      const imgResult = await manipulateAsync(uri, []);
      setImageWidth(imgResult.width);
      setImageHeight(imgResult.height);

      // expo-face-detector は実機依存のため require で遅延ロード＋フォールバック
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FaceDetector = require('expo-face-detector');
      const { detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks } = FaceDetector;

      const detection = await detectFacesAsync(uri, {
        mode: FaceDetectorMode.accurate,
        detectLandmarks: FaceDetectorLandmarks.all,
      });

      type RawPoint = { x: number; y: number };
      type RawFace = Partial<Record<keyof FaceLandmarks, RawPoint>>;
      const faces: RawFace[] = detection?.faces ?? [];

      if (faces.length === 0) {
        setError('顔が検出できませんでした');
        return;
      }

      const face = faces[0];
      const fallback: RawPoint = { x: 0, y: 0 };
      const mapped: FaceLandmarks = {
        leftEyePosition:     face.leftEyePosition     ?? fallback,
        rightEyePosition:    face.rightEyePosition    ?? fallback,
        noseBasePosition:    face.noseBasePosition     ?? fallback,
        bottomMouthPosition: face.bottomMouthPosition  ?? fallback,
        leftEarPosition:     face.leftEarPosition      ?? fallback,
        rightEarPosition:    face.rightEarPosition     ?? fallback,
        leftCheekPosition:   face.leftCheekPosition    ?? fallback,
        rightCheekPosition:  face.rightCheekPosition   ?? fallback,
      };

      setLandmarks(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : '顔検出に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (imageUri != null) {
      detectFace(imageUri);
    } else {
      setLandmarks(null);
      setImageWidth(0);
      setImageHeight(0);
      setError(null);
    }
  }, [imageUri, detectFace]);

  return { landmarks, imageWidth, imageHeight, loading, error, detectFace };
}
