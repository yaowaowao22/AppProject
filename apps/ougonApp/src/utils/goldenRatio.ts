import { Point, FaceLandmarks, PhiDeviation, PhiDeviations } from '../types/face';

export const PHI = 1.618033988749895;

export function dist(a: Point, b: Point): number {
  const ax = a?.x ?? 0;
  const ay = a?.y ?? 0;
  const bx = b?.x ?? 0;
  const by = b?.y ?? 0;
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function check(actual: number, target: number): PhiDeviation {
  const safeActual = actual ?? 0;
  const safeTarget = target ?? 1;
  const deviation = Math.abs(safeActual - safeTarget) / safeTarget;
  // |actual - target| / target の逆数を 0–100 にマッピング
  // 完全一致(deviation=0)→100、乖離が大きいほど 0 に近づく
  const score = Math.max(0, Math.round(100 * (1 - Math.min(deviation, 1))));
  return {
    label: '',
    actual: safeActual,
    target: safeTarget,
    deltaPixels: 0,
    score,
  };
}

export function calcDeviations(
  landmarks: FaceLandmarks,
  imageWidth: number,
  imageHeight: number,
): PhiDeviations {
  const lm = landmarks ?? ({} as FaceLandmarks);
  const w = imageWidth ?? 0;
  const h = imageHeight ?? 0;

  const leftEar = lm.leftEarPosition ?? { x: 0, y: h * 0.4 };
  const rightEar = lm.rightEarPosition ?? { x: w, y: h * 0.4 };
  const leftEye = lm.leftEyePosition ?? { x: w * 0.3, y: h * 0.4 };
  const rightEye = lm.rightEyePosition ?? { x: w * 0.7, y: h * 0.4 };
  const noseBase = lm.noseBasePosition ?? { x: w * 0.5, y: h * 0.55 };
  const bottomMouth = lm.bottomMouthPosition ?? { x: w * 0.5, y: h * 0.65 };
  const leftMouth = lm.leftMouthPosition ?? { x: w * 0.43, y: h * 0.65 };
  const rightMouth = lm.rightMouthPosition ?? { x: w * 0.57, y: h * 0.65 };

  const faceWidth = dist(leftEar, rightEar) || 1;

  // topOfHead 推定: 最も高いランドマーク(topY ≈ 目/耳ライン)から
  // 上方向に額の高さ分(≈ 予備顔高 × 0.4)を加算。
  // ⚠️ 旧実装は noseBase 基準だったため、鼻位置により faceHeight が変動していた。
  // topY を基準に固定することで、推定が安定する。
  const topY = Math.min(leftEar.y, rightEar.y, leftEye.y, rightEye.y);
  const prelimFaceHeight = Math.max(bottomMouth.y - topY, 1);
  const topOfHead: Point = {
    x: (leftEye.x + rightEye.x) / 2,
    y: topY - prelimFaceHeight * 0.4,
  };

  const faceHeight = dist(topOfHead, bottomMouth) || 1;
  const eyeWidth = dist(leftEye, rightEye) || 1;

  // mouthWidth: mouthLeft/mouthRight ランドマークから実測値を取得
  // noseWidth: ML Kitは鼻幅ランドマークを提供しないため顔幅の比率推定
  // 人体測定の平均比率: 鼻幅≈顔幅×0.25
  const mouthWidth = dist(leftMouth, rightMouth) || 1;
  const noseWidth = faceWidth * 0.25;

  // 眉間 (midEye) → 鼻先 (noseBase) → 顎 (bottomMouth)
  const midEye: Point = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
  };
  const browToNose = dist(midEye, noseBase) || 1;
  const noseToJaw = dist(noseBase, bottomMouth) || 1;

  // --- 1. 顔の縦横比 (faceHeight / faceWidth → PHI) ---
  const faceAspectRatio = faceHeight / faceWidth;
  const faceAspect: PhiDeviation = {
    ...check(faceAspectRatio, PHI),
    label: '顔縦横比',
    deltaPixels: Math.round((PHI - faceAspectRatio) * faceWidth),
  };

  // --- 2. 目幅 / 顔幅 (eyeWidth / faceWidth → 1/φ²) ---
  const eyeToFaceTarget = 1 / (PHI * PHI);
  const eyeToFaceRatio = eyeWidth / faceWidth;
  const eyeToFace: PhiDeviation = {
    ...check(eyeToFaceRatio, eyeToFaceTarget),
    label: '目幅/顔幅',
    deltaPixels: Math.round((eyeToFaceTarget - eyeToFaceRatio) * faceWidth),
  };

  // --- 3. 鼻幅 / 口幅 (noseWidth / mouthWidth → 1/φ) ---
  const noseToMouthTarget = 1 / PHI;
  const noseToMouthRatio = noseWidth / mouthWidth;
  const noseToMouth: PhiDeviation = {
    ...check(noseToMouthRatio, noseToMouthTarget),
    label: '鼻幅/口幅',
    deltaPixels: Math.round((noseToMouthTarget - noseToMouthRatio) * mouthWidth),
  };

  // --- 4. 眉間〜鼻先 / 鼻先〜顎 (browToNose / noseToJaw → PHI) ---
  const noseRatioValue = browToNose / noseToJaw;
  const noseRatio: PhiDeviation = {
    ...check(noseRatioValue, PHI),
    label: '眉間鼻先/鼻先顎',
    deltaPixels: Math.round((PHI - noseRatioValue) * noseToJaw),
  };

  // --- 5. 顔幅 / 目幅 (faceWidth / eyeWidth → φ²) ---
  const faceToEyeTarget = PHI * PHI;
  const faceToEyeRatio = faceWidth / eyeWidth;
  const faceToEye: PhiDeviation = {
    ...check(faceToEyeRatio, faceToEyeTarget),
    label: '顔幅/目幅',
    deltaPixels: Math.round((faceToEyeTarget - faceToEyeRatio) * eyeWidth),
  };

  // faceToEye は eyeToFace の逆数(1/φ² ↔ φ²)で数学的に同一の検査。
  // totalScore に含めると目の比率が二重カウントされるため、4項目のみで平均する。
  const totalScore = Math.round(
    (faceAspect.score + eyeToFace.score + noseToMouth.score + noseRatio.score) / 4,
  );

  return { faceAspect, eyeToFace, noseToMouth, noseRatio, faceToEye, totalScore };
}
