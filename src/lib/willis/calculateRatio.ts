import type { WillisKeypoints } from "../mediapipe/types";
import { correctKeypointsForPose } from "../mediapipe/headPose";

/**
 * Willis 비율 계산
 *
 * Willis 비율 = (동공~비하점 거리) / (비하점~턱끝 거리)
 * - 동공 Y = 좌우 홍채 중심의 Y 평균
 * - 비하점 Y = subnasale Y
 * - 턱끝 Y = chin Y
 *
 * 정규화 좌표(0~1) 기준이므로 이미지 크기와 무관
 */
export function calculateWillisRatio(keypoints: WillisKeypoints): number {
  // 동공 Y 좌표 평균
  const pupilY = (keypoints.leftPupil.y + keypoints.rightPupil.y) / 2;
  const subnasaleY = keypoints.subnasale.y;
  const chinY = keypoints.chin.y;

  // 상부 거리: 동공 → 비하점
  const upperDistance = Math.abs(subnasaleY - pupilY);
  // 하부 거리: 비하점 → 턱끝
  const lowerDistance = Math.abs(chinY - subnasaleY);

  // 분모가 0이면 비율 계산 불가
  if (lowerDistance === 0) return 0;

  return upperDistance / lowerDistance;
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
 * Head Pose 보정된 Willis 비율 계산
 * 4x4 변환 행렬의 역회전을 키포인트에 적용 후 비율 계산
 */
export function calculateCorrectedWillisRatio(
  keypoints: WillisKeypoints,
  matrixData: number[]
): number {
  const corrected = correctKeypointsForPose(keypoints, matrixData);
  return calculateWillisRatio(corrected);
}
