// MediaPipe Face Landmarker 핵심 인덱스 매핑
// 참조: https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png

// Willis 비율 계산에 필요한 키포인트
export const LANDMARK_INDICES = {
  // 홍채 중심 (refineLandmarks: true 필요)
  LEFT_IRIS_CENTER: 468,
  RIGHT_IRIS_CENTER: 473,

  // 비하점 (Subnasale) — 코 밑 중앙
  SUBNASALE: 94,

  // 구렬 (Rima Oris) — 상하 입술 중앙
  UPPER_LIP_CENTER: 13,
  LOWER_LIP_CENTER: 14,

  // 턱끝 (Chin) — 턱 정중부 최하단
  CHIN: 152,

  // 동공간선 수평 정렬에 사용
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
} as const;

// 시각화에 사용할 인덱스 배열
export const VISUALIZATION_INDICES = [
  LANDMARK_INDICES.LEFT_IRIS_CENTER,
  LANDMARK_INDICES.RIGHT_IRIS_CENTER,
  LANDMARK_INDICES.SUBNASALE,
  LANDMARK_INDICES.UPPER_LIP_CENTER,
  LANDMARK_INDICES.LOWER_LIP_CENTER,
  LANDMARK_INDICES.CHIN,
] as const;
