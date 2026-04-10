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
  const safeTarget = target || 1;
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

  const faceWidth = dist(leftEar, rightEar) || 1;

  // topOfHead 推定: 各ランドマークの最小 y から仮の顔高を求め、
  // noseBasePosition から上方向に faceHeight × 0.618 分を推定
  const topY = Math.min(leftEar.y, rightEar.y, leftEye.y, rightEye.y);
  const prelimFaceHeight = Math.max(bottomMouth.y - topY, 1);
  const topOfHead: Point = {
    x: noseBase.x,
    y: noseBase.y - prelimFaceHeight * 0.618,
  };

  const faceHeight = dist(topOfHead, bottomMouth) || 1;
  const eyeWidth = dist(leftEye, rightEye) || 1;

  // noseWidth / mouthWidth 推定 (expo-face-detector は直接提供しない)
  // 人体測定の平均比率: 鼻幅≈顔幅×0.25、口幅≈顔幅×0.375
  const noseWidth = faceWidth * 0.25;
  const mouthWidth = faceWidth * 0.375;

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

  const totalScore = Math.round(
    (faceAspect.score + eyeToFace.score + noseToMouth.score + noseRatio.score + faceToEye.score) / 5,
  );

  return { faceAspect, eyeToFace, noseToMouth, noseRatio, faceToEye, totalScore };
}
