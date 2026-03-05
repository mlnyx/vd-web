// MediaPipe Face Landmarker 관련 타입 정의

// 3D 좌표 (MediaPipe 출력)
export interface NormalizedLandmark {
  x: number; // 0~1 (좌→우)
  y: number; // 0~1 (상→하)
  z: number; // 깊이
}

// 478 랜드마크 배열
export type FaceLandmarks = NormalizedLandmark[];

// Willis 핵심 키포인트 (5개)
export interface WillisKeypoints {
  leftPupil: NormalizedLandmark;
  rightPupil: NormalizedLandmark;
  subnasale: NormalizedLandmark;
  rimaOris: NormalizedLandmark;
  chin: NormalizedLandmark;
}

// Head Pose (Euler 각도)
export interface HeadPose {
  pitch: number; // 상하 (도)
  yaw: number;   // 좌우 (도)
  roll: number;  // 기울기 (도)
}

// 자세 유효성 검증 결과
export interface PoseValidation {
  pitchOk: boolean;
  yawOk: boolean;
  rollOk: boolean;
  isValid: boolean;
}

// 실시간 얼굴 상태
export interface FaceStatus {
  detected: boolean;
  inGuide: boolean;
  ratio: number | null;
  verdict: "NORMAL" | "LOWER" | null;
  countdown: number | null; // 자동 캡처 카운트다운 (초)
  headPose?: HeadPose;
  poseValid?: boolean;
}

// 자동 캡처 결과
export interface AutoCaptureResult {
  imageBase64: string;
  landmarks: FaceLandmarks;
  ratio: number;
  verdict: "NORMAL" | "LOWER";
  keypoints: WillisKeypoints;
  headPose?: HeadPose;
}
