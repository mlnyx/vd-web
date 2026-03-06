import { LANDMARK_INDICES } from "./landmarkIndices";
import type { NormalizedLandmark, WillisKeypoints } from "./types";

// 가이드 타원 중심 Y 비율 (canvasDrawing.ts와 공유)
const GUIDE_CY_RATIO = 0.42;

// 478 랜드마크에서 Willis 키포인트 추출
export function extractWillisKeypoints(landmarks: NormalizedLandmark[]): WillisKeypoints {
  const upperLip = landmarks[LANDMARK_INDICES.UPPER_LIP_CENTER];
  const lowerLip = landmarks[LANDMARK_INDICES.LOWER_LIP_CENTER];

  return {
    leftPupil: landmarks[LANDMARK_INDICES.LEFT_IRIS_CENTER],
    rightPupil: landmarks[LANDMARK_INDICES.RIGHT_IRIS_CENTER],
    subnasale: landmarks[LANDMARK_INDICES.SUBNASALE],
    rimaOris: {
      x: (upperLip.x + lowerLip.x) / 2,
      y: (upperLip.y + lowerLip.y) / 2,
      z: (upperLip.z + lowerLip.z) / 2,
    },
    chin: landmarks[LANDMARK_INDICES.CHIN],
  };
}

// 얼굴이 가이드 타원 안에 있는지 확인 (단일 루프로 최적화)
export function checkFaceInGuide(landmarks: NormalizedLandmark[]): boolean {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < landmarks.length; i++) {
    const { x, y } = landmarks[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const faceHeight = maxY - minY;
  if (faceHeight < 0.25 || faceHeight > 0.65) return false;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  if (Math.abs(centerX - 0.5) > 0.15) return false;
  if (Math.abs(centerY - GUIDE_CY_RATIO) > 0.18) return false;

  const leftPupil = landmarks[LANDMARK_INDICES.LEFT_IRIS_CENTER];
  const rightPupil = landmarks[LANDMARK_INDICES.RIGHT_IRIS_CENTER];
  const dx = rightPupil.x - leftPupil.x;
  const dy = rightPupil.y - leftPupil.y;
  const tiltDeg = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  if (tiltDeg > 5) return false;

  return true;
}
