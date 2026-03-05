import { useState, useCallback } from "react";
import { useFaceLandmarks } from "./useFaceLandmarks";
import { calculateWillisRatio } from "../willis/calculateRatio";
import { assessVD } from "../willis/assessVD";
import type { WillisKeypoints, FaceLandmarks } from "../mediapipe/types";
import type { PhotoResult, VDVerdict } from "../store/assessmentStore";

interface UseWillisAssessmentResult {
  // 얼굴 랜드마크 상태
  faceLandmarks: ReturnType<typeof useFaceLandmarks>;
  // 현재 분석 결과
  willisRatio: number | null;
  verdict: VDVerdict | null;
  // 촬영 + 분석 완료 여부
  hasResult: boolean;
  // 결과를 PhotoResult로 변환
  getPhotoResult: (uri: string, base64?: string) => PhotoResult | null;
  // 분석 완료 콜백 (랜드마크 수신 시 자동 계산)
  onLandmarksDetected: (
    landmarks: FaceLandmarks,
    imageWidth: number,
    imageHeight: number
  ) => void;
  // 초기화
  reset: () => void;
}

export function useWillisAssessment(): UseWillisAssessmentResult {
  const faceLandmarks = useFaceLandmarks();
  const [willisRatio, setWillisRatio] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<VDVerdict | null>(null);

  const onLandmarksDetected = useCallback(
    (landmarks: FaceLandmarks, imageWidth: number, imageHeight: number) => {
      // 랜드마크 상태 업데이트
      faceLandmarks.handleLandmarks(landmarks, imageWidth, imageHeight);
    },
    [faceLandmarks.handleLandmarks]
  );

  // willisKeypoints가 변경되면 비율 계산
  const keypoints = faceLandmarks.willisKeypoints;
  if (keypoints && willisRatio === null) {
    const ratio = calculateWillisRatio(keypoints);
    const result = assessVD(ratio);
    setWillisRatio(ratio);
    setVerdict(result);
  }

  const hasResult = willisRatio !== null && verdict !== null;

  const getPhotoResult = useCallback(
    (uri: string, base64?: string): PhotoResult | null => {
      if (!hasResult || !keypoints) return null;

      return {
        uri,
        base64,
        keypoints: {
          leftPupil: { x: keypoints.leftPupil.x, y: keypoints.leftPupil.y },
          rightPupil: { x: keypoints.rightPupil.x, y: keypoints.rightPupil.y },
          subnasale: { x: keypoints.subnasale.x, y: keypoints.subnasale.y },
          rimaOris: { x: keypoints.rimaOris.x, y: keypoints.rimaOris.y },
          chin: { x: keypoints.chin.x, y: keypoints.chin.y },
        },
        willisRatio: willisRatio!,
        verdict: verdict!,
        timestamp: Date.now(),
      };
    },
    [hasResult, keypoints, willisRatio, verdict]
  );

  const reset = useCallback(() => {
    faceLandmarks.reset();
    setWillisRatio(null);
    setVerdict(null);
  }, [faceLandmarks.reset]);

  return {
    faceLandmarks,
    willisRatio,
    verdict,
    hasResult,
    getPhotoResult,
    onLandmarksDetected,
    reset,
  };
}
