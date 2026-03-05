import { useState, useCallback, useRef } from "react";
import type { FaceLandmarks, WillisKeypoints } from "../mediapipe/types";
import { LANDMARK_INDICES } from "../mediapipe/landmarkIndices";

interface UseFaceLandmarksResult {
  // MediaPipe 준비 상태
  isReady: boolean;
  // 분석 중 여부
  isProcessing: boolean;
  // 에러 메시지
  error: string | null;
  // 원시 랜드마크 (478개)
  rawLandmarks: FaceLandmarks | null;
  // Willis 키포인트 (5개)
  willisKeypoints: WillisKeypoints | null;
  // 이미지 크기
  imageSize: { width: number; height: number } | null;

  // 콜백 (MediaPipeWebView에 전달)
  handleReady: () => void;
  handleLandmarks: (
    landmarks: FaceLandmarks,
    imageWidth: number,
    imageHeight: number
  ) => void;
  handleError: (message: string) => void;
  handleProcessing: () => void;
  // 상태 초기화
  reset: () => void;
}

// 478 랜드마크에서 Willis 키포인트 추출
function extractWillisKeypoints(landmarks: FaceLandmarks): WillisKeypoints {
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

export function useFaceLandmarks(): UseFaceLandmarksResult {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawLandmarks, setRawLandmarks] = useState<FaceLandmarks | null>(null);
  const [willisKeypoints, setWillisKeypoints] =
    useState<WillisKeypoints | null>(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setError(null);
  }, []);

  const handleLandmarks = useCallback(
    (landmarks: FaceLandmarks, imageWidth: number, imageHeight: number) => {
      setRawLandmarks(landmarks);
      setWillisKeypoints(extractWillisKeypoints(landmarks));
      setImageSize({ width: imageWidth, height: imageHeight });
      setIsProcessing(false);
      setError(null);
    },
    []
  );

  const handleError = useCallback((message: string) => {
    setError(message);
    setIsProcessing(false);
  }, []);

  const handleProcessing = useCallback(() => {
    setIsProcessing(true);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setRawLandmarks(null);
    setWillisKeypoints(null);
    setImageSize(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    isReady,
    isProcessing,
    error,
    rawLandmarks,
    willisKeypoints,
    imageSize,
    handleReady,
    handleLandmarks,
    handleError,
    handleProcessing,
    reset,
  };
}
