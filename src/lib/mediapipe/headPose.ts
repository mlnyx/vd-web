import type { HeadPose, PoseValidation, NormalizedLandmark, WillisKeypoints } from "./types";

// 기본 허용 임계값 (도)
const DEFAULT_PITCH_THRESHOLD = 15;
const DEFAULT_YAW_THRESHOLD = 10;
const DEFAULT_ROLL_THRESHOLD = 5;

/**
 * MediaPipe 4x4 Facial Transformation Matrix에서 Euler 각도 추출
 * 행렬은 column-major order (OpenGL 스타일)
 */
export function extractHeadPose(matrixData: number[]): HeadPose {
  // column-major → row 접근: M[row][col] = matrixData[col * 4 + row]
  const r00 = matrixData[0];
  const r01 = matrixData[4];
  const r02 = matrixData[8];
  const r12 = matrixData[9];
  const r22 = matrixData[10];

  const toDeg = 180 / Math.PI;

  // Euler 각도 추출 (XYZ 순서)
  const pitch = Math.atan2(-r12, r22) * toDeg;
  const yaw = Math.asin(Math.min(1, Math.max(-1, r02))) * toDeg;
  const roll = Math.atan2(-r01, r00) * toDeg;

  return { pitch, yaw, roll };
}

/**
 * Head Pose 유효성 검증
 */
export function validateHeadPose(
  pose: HeadPose,
  thresholds?: { pitch?: number; yaw?: number; roll?: number }
): PoseValidation {
  const pitchMax = thresholds?.pitch ?? DEFAULT_PITCH_THRESHOLD;
  const yawMax = thresholds?.yaw ?? DEFAULT_YAW_THRESHOLD;
  const rollMax = thresholds?.roll ?? DEFAULT_ROLL_THRESHOLD;

  const pitchOk = Math.abs(pose.pitch) <= pitchMax;
  const yawOk = Math.abs(pose.yaw) <= yawMax;
  const rollOk = Math.abs(pose.roll) <= rollMax;

  return {
    pitchOk,
    yawOk,
    rollOk,
    isValid: pitchOk && yawOk && rollOk,
  };
}

/**
 * 3x3 회전 행렬의 역행렬(전치)을 적용하여 포인트를 정면 등가 좌표로 보정
 */
function applyInverseRotation(
  point: NormalizedLandmark,
  rot: number[], // 3x3 row-major
  center: NormalizedLandmark
): NormalizedLandmark {
  // center 기준 상대 좌표
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const dz = point.z - center.z;

  // 역회전 (전치 행렬 적용)
  return {
    x: center.x + rot[0] * dx + rot[3] * dy + rot[6] * dz,
    y: center.y + rot[1] * dx + rot[4] * dy + rot[7] * dz,
    z: center.z + rot[2] * dx + rot[5] * dy + rot[8] * dz,
  };
}

/**
 * 4x4 변환 행렬에서 3x3 회전 부분 추출 (row-major)
 */
function extractRotation3x3(matrixData: number[]): number[] {
  // column-major 4x4 → row-major 3x3
  return [
    matrixData[0], matrixData[4], matrixData[8],
    matrixData[1], matrixData[5], matrixData[9],
    matrixData[2], matrixData[6], matrixData[10],
  ];
}

/**
 * 전체 Willis 키포인트에 역회전 보정 적용
 * 얼굴 중심(코 끝)을 기준으로 역회전
 */
export function correctKeypointsForPose(
  keypoints: WillisKeypoints,
  matrixData: number[]
): WillisKeypoints {
  const rot = extractRotation3x3(matrixData);

  // 얼굴 중심: subnasale 사용
  const center = keypoints.subnasale;

  return {
    leftPupil: applyInverseRotation(keypoints.leftPupil, rot, center),
    rightPupil: applyInverseRotation(keypoints.rightPupil, rot, center),
    subnasale: keypoints.subnasale, // 중심점은 그대로
    rimaOris: applyInverseRotation(keypoints.rimaOris, rot, center),
    chin: applyInverseRotation(keypoints.chin, rot, center),
  };
}

/**
 * 자세 교정 안내 메시지 생성
 */
export function getPoseHintMessage(pose: HeadPose): string | null {
  const validation = validateHeadPose(pose);
  if (validation.isValid) return null;

  if (!validation.pitchOk) {
    return pose.pitch > 0 ? "고개를 약간 내려주세요" : "고개를 약간 올려주세요";
  }
  if (!validation.yawOk) {
    return pose.yaw > 0 ? "얼굴을 왼쪽으로 돌려주세요" : "얼굴을 오른쪽으로 돌려주세요";
  }
  if (!validation.rollOk) {
    return pose.roll > 0 ? "고개를 왼쪽으로 기울여주세요" : "고개를 오른쪽으로 기울여주세요";
  }

  return "정면을 바라봐주세요";
}
