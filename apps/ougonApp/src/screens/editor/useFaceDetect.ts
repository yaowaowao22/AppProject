import { useState, useCallback, useEffect } from 'react';
import { manipulateAsync } from 'expo-image-manipulator';
import FaceDetection from '@react-native-ml-kit/face-detection';
import type { FaceLandmarks } from '../../types/face';

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

      const faces = await FaceDetection.detect(uri, {
        landmarkMode: 'all',
        performanceMode: 'accurate',
      });

      if (faces.length === 0) {
        setError('顔が検出できませんでした');
        return;
      }

      const face = faces[0];
      const lm = face.landmarks ?? [];
      const fallback = { x: 0, y: 0 };

      const findPos = (type: string) =>
        lm.find((l) => l.type === type)?.position ?? fallback;

      const mapped: FaceLandmarks = {
        leftEyePosition:     findPos('leftEye'),
        rightEyePosition:    findPos('rightEye'),
        noseBasePosition:    findPos('noseBase'),
        bottomMouthPosition: findPos('mouthBottom'),
        leftEarPosition:     findPos('leftEar'),
        rightEarPosition:    findPos('rightEar'),
        leftCheekPosition:   findPos('leftCheek'),
        rightCheekPosition:  findPos('rightCheek'),
        leftMouthPosition:   findPos('mouthLeft'),
        rightMouthPosition:  findPos('mouthRight'),
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
