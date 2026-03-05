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
 * 4x4 column-major 변환 행렬의 역행렬 계산
 * MediaPipe facialTransformationMatrixes는 rigid transform (회전 + 이동)이므로
 * 역행렬 = [R^T | -R^T * t]
 */
function invertTransformMatrix(m: number[]): number[] {
  // column-major 접근: M[row][col] = m[col * 4 + row]
  // 회전 부분 전치 (R^T)
  const r00 = m[0], r10 = m[1], r20 = m[2];
  const r01 = m[4], r11 = m[5], r21 = m[6];
  const r02 = m[8], r12 = m[9], r22 = m[10];
  // 이동 부분
  const tx = m[12], ty = m[13], tz = m[14];

  // -R^T * t
  const itx = -(r00 * tx + r10 * ty + r20 * tz);
  const ity = -(r01 * tx + r11 * ty + r21 * tz);
  const itz = -(r02 * tx + r12 * ty + r22 * tz);

  // column-major 출력
  return [
    r00, r01, r02, 0,
    r10, r11, r12, 0,
    r20, r21, r22, 0,
    itx, ity, itz, 1,
  ];
}

/**
 * 4x4 column-major 행렬을 3D 점에 적용
 */
function applyMatrix4x4(
  m: number[],
  x: number,
  y: number,
  z: number
): NormalizedLandmark {
  return {
    x: m[0] * x + m[4] * y + m[8] * z + m[12],
    y: m[1] * x + m[5] * y + m[9] * z + m[13],
    z: m[2] * x + m[6] * y + m[10] * z + m[14],
  };
}

/**
 * 정규화 좌표 → metric 3D 좌표 변환 (1점)
 * 1) 정규화 좌표를 화면 좌표로 변환 (z는 x와 같은 스케일)
 * 2) facialTransformationMatrixes 역행렬 적용 → canonical space (cm 단위)
 */
function toMetric3DPoint(
  point: NormalizedLandmark,
  invMatrix: number[],
  imageWidth: number,
  imageHeight: number,
): NormalizedLandmark {
  const sx = point.x * imageWidth;
  const sy = point.y * imageHeight;
  const sz = point.z * imageWidth; // z는 x와 같은 스케일 (MediaPipe 명세)
  return applyMatrix4x4(invMatrix, sx, sy, sz);
}

/**
 * 전체 Willis 키포인트를 metric 3D 좌표로 변환
 * facialTransformationMatrixes의 역행렬을 적용하여 자세에 무관한 좌표 복원
 */
export function toMetric3DKeypoints(
  keypoints: WillisKeypoints,
  matrixData: number[],
  imageWidth: number,
  imageHeight: number,
): WillisKeypoints {
  const inv = invertTransformMatrix(matrixData);
  return {
    leftPupil: toMetric3DPoint(keypoints.leftPupil, inv, imageWidth, imageHeight),
    rightPupil: toMetric3DPoint(keypoints.rightPupil, inv, imageWidth, imageHeight),
    subnasale: toMetric3DPoint(keypoints.subnasale, inv, imageWidth, imageHeight),
    rimaOris: toMetric3DPoint(keypoints.rimaOris, inv, imageWidth, imageHeight),
    chin: toMetric3DPoint(keypoints.chin, inv, imageWidth, imageHeight),
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
