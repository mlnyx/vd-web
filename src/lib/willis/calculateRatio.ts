import type { NormalizedLandmark, WillisKeypoints } from "../mediapipe/types";
import { toMetric3DKeypoints } from "../mediapipe/headPose";

/**
 * Willis 비율 계산 (논문 원법)
 *
 * Willis 비율 = (비하점~턱끝 거리) / (동공~구열 거리)
 * - 동공 = 좌우 홍채 중심의 중점
 * - 구열 = 상하 입술 중앙
 * - 비하점 = subnasale (인덱스 94)
 * - 턱끝 = chin (인덱스 152)
 *
 * 2D 유클리드 거리 사용 + aspect ratio 보정
 */
export function calculateWillisRatio(
  keypoints: WillisKeypoints,
  imageSize?: { width: number; height: number }
): number {
  // aspect ratio 보정 스케일 팩터
  const scaleX = imageSize?.width ?? 1;
  const scaleY = imageSize?.height ?? 1;

  const dist = (ax: number, ay: number, bx: number, by: number) => {
    const dx = (ax - bx) * scaleX;
    const dy = (ay - by) * scaleY;
    return Math.hypot(dx, dy);
  };

  // 동공 중점
  const pupilX = (keypoints.leftPupil.x + keypoints.rightPupil.x) / 2;
  const pupilY = (keypoints.leftPupil.y + keypoints.rightPupil.y) / 2;

  // 동공~구열 거리
  const pupilToRima = dist(pupilX, pupilY, keypoints.rimaOris.x, keypoints.rimaOris.y);
  // 비하점~턱끝 거리
  const subnasaleToChin = dist(keypoints.subnasale.x, keypoints.subnasale.y, keypoints.chin.x, keypoints.chin.y);

  // 분모가 0이면 비율 계산 불가
  if (pupilToRima === 0) return 0;

  return subnasaleToChin / pupilToRima;
}

/**
 * 동공간선 기울기 계산 (도 단위)
 * 수평 정렬 검증 및 재촬영 권고에 사용
 */
export function calculatePupilTilt(keypoints: WillisKeypoints): number {
  const dx = keypoints.rightPupil.x - keypoints.leftPupil.x;
  const dy = keypoints.rightPupil.y - keypoints.leftPupil.y;

  // 라디안 → 도 변환
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * 동공간선 기울기가 허용 범위 내인지 확인
 * ±5도 이내면 OK
 */
export function isPupilAlignmentOk(
  keypoints: WillisKeypoints,
  threshold = 5
): boolean {
  const tilt = Math.abs(calculatePupilTilt(keypoints));
  return tilt <= threshold;
}

/**
 * 3D 유클리드 거리 기반 Willis 비율 계산
 * metric 3D 좌표 (cm 단위)에서 x, y, z 모두 사용
 */
export function calculateWillisRatio3D(keypoints: WillisKeypoints): number {
  const dist3d = (a: NormalizedLandmark, b: NormalizedLandmark) =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

  // 동공 중점 (3D)
  const pupilMid: NormalizedLandmark = {
    x: (keypoints.leftPupil.x + keypoints.rightPupil.x) / 2,
    y: (keypoints.leftPupil.y + keypoints.rightPupil.y) / 2,
    z: (keypoints.leftPupil.z + keypoints.rightPupil.z) / 2,
  };

  const pupilToRima = dist3d(pupilMid, keypoints.rimaOris);
  const subnasaleToChin = dist3d(keypoints.subnasale, keypoints.chin);

  if (pupilToRima === 0) return 0;
  return subnasaleToChin / pupilToRima;
}

/**
 * Metric 3D 좌표 기반 Head Pose 보정 Willis 비율 계산
 * facialTransformationMatrixes 역행렬로 canonical space 복원 후 3D 거리 계산
 */
export function calculateCorrectedWillisRatio(
  keypoints: WillisKeypoints,
  matrixData: number[],
  imageSize: { width: number; height: number }
): number {
  const metric = toMetric3DKeypoints(keypoints, matrixData, imageSize.width, imageSize.height);
  return calculateWillisRatio3D(metric);
}
