import { useRef, useEffect, useCallback, type MutableRefObject } from "react";
import { calculateWillisRatio, calculateCorrectedWillisRatio } from "@/lib/willis/calculateRatio";
import { assessVD } from "@/lib/willis/assessVD";
import { extractHeadPose, validateHeadPose } from "@/lib/mediapipe/headPose";
import { extractWillisKeypoints, checkFaceInGuide } from "@/lib/mediapipe/extractKeypoints";
import { createRatioBuffer } from "@/lib/willis/ratioBuffer";
import {
  drawOverlay,
  drawGuideEllipse,
  drawNoFaceHint,
  drawPoseHint,
  drawCountdown,
} from "../overlays/canvasDrawing";
import type {
  FaceLandmarks,
  FaceStatus,
  AutoCaptureResult,
  HeadPose,
} from "@/lib/mediapipe/types";

type FaceLandmarkerType = import("@mediapipe/tasks-vision").FaceLandmarker;

interface UseDetectionLoopOptions {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  landmarkerRef: MutableRefObject<FaceLandmarkerType | null>;
  onAutoCapture?: (result: AutoCaptureResult) => void;
  onFaceStatus?: (status: FaceStatus) => void;
}

export function useDetectionLoop({
  videoRef,
  canvasRef,
  landmarkerRef,
  onAutoCapture,
  onFaceStatus,
}: UseDetectionLoopOptions) {
  const rafRef = useRef<number>(0);
  const countdownRef = useRef<number | null>(null);
  const countdownStartRef = useRef<number>(0);
  const lastStatusTimeRef = useRef<number>(0);
  const capturedRef = useRef(false);
  const detectFailCountRef = useRef(0);
  const ratioBufferRef = useRef(createRatioBuffer(10));

  // 콜백 ref
  const onFaceStatusRef = useRef(onFaceStatus);
  const onAutoCaptureRef = useRef(onAutoCapture);
  useEffect(() => { onFaceStatusRef.current = onFaceStatus; }, [onFaceStatus]);
  useEffect(() => { onAutoCaptureRef.current = onAutoCapture; }, [onAutoCapture]);

  const startDetectionLoop = useCallback(() => {
    const detect = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      // Canvas 크기 동기화
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      // 미러링 + 비디오 그리기
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      ctx.restore();

      // 이미 캡처된 경우 루프 중지
      if (capturedRef.current) return;

      let faceDetected = false;

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        detectFailCountRef.current = 0;

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          faceDetected = true;
          const landmarks = result.faceLandmarks[0] as FaceLandmarks;
          const keypoints = extractWillisKeypoints(landmarks);

          // 변환 행렬에서 Head Pose 추출 및 보정
          let headPose: HeadPose | undefined;
          let poseValid = true;
          let ratio: number;

          const imageSize = { width: canvas.width, height: canvas.height };
          const matrices = result.facialTransformationMatrixes;
          if (matrices && matrices.length > 0) {
            const matrixData = Array.from(matrices[0].data);
            headPose = extractHeadPose(matrixData);
            const validation = validateHeadPose(headPose);
            poseValid = validation.isValid;
            ratio = calculateCorrectedWillisRatio(keypoints, matrixData, imageSize);
          } else {
            ratio = calculateWillisRatio(keypoints, imageSize);
          }

          const verdict = assessVD(ratio);
          const inGuide = checkFaceInGuide(landmarks);

          // 비율 버퍼에 추가 (유효 자세일 때만)
          if (poseValid) {
            ratioBufferRef.current.push(ratio);
          }

          drawOverlay(ctx, landmarks, keypoints, canvas.width, canvas.height, ratio, verdict);

          // 자세 교정 안내
          if (headPose && !poseValid) {
            drawPoseHint(ctx, canvas.width, canvas.height, headPose);
          }

          // FaceStatus 이벤트 (~5fps)
          const now = Date.now();
          if (now - lastStatusTimeRef.current > 200) {
            lastStatusTimeRef.current = now;
            onFaceStatusRef.current?.({
              detected: true,
              inGuide,
              ratio,
              verdict,
              countdown: countdownRef.current,
              headPose,
              poseValid,
            });
          }

          // 자동 캡처 로직 (자세 유효할 때만 진행)
          if (inGuide && poseValid) {
            if (countdownRef.current === null) {
              countdownRef.current = 2;
              countdownStartRef.current = Date.now();
            } else {
              const elapsed = (Date.now() - countdownStartRef.current) / 1000;
              countdownRef.current = Math.max(0, 2 - elapsed);

              if (countdownRef.current <= 0) {
                // 자동 캡처 실행 — 안정화된 중앙값 사용
                capturedRef.current = true;

                const bufferResult = ratioBufferRef.current.getResult();
                const finalRatio = bufferResult.isStable ? bufferResult.medianRatio : ratio;
                const finalVerdict = assessVD(finalRatio);

                const captureCanvas = document.createElement("canvas");
                captureCanvas.width = canvas.width;
                captureCanvas.height = canvas.height;
                const captureCtx = captureCanvas.getContext("2d");
                if (captureCtx && videoRef.current) {
                  captureCtx.translate(captureCanvas.width, 0);
                  captureCtx.scale(-1, 1);
                  captureCtx.drawImage(videoRef.current, 0, 0);
                }

                const imageBase64 = captureCanvas.toDataURL("image/jpeg", 0.9);
                onAutoCaptureRef.current?.({
                  imageBase64,
                  landmarks,
                  ratio: finalRatio,
                  verdict: finalVerdict,
                  keypoints,
                  headPose,
                });
                return; // 루프 종료
              }
            }

            drawCountdown(ctx, canvas.width, canvas.height, countdownRef.current, 2);
          } else {
            // 자세 무효 또는 가이드 밖 → 카운트다운 리셋
            countdownRef.current = null;
          }
        } else {
          countdownRef.current = null;
          ratioBufferRef.current.clear();
          const now = Date.now();
          if (now - lastStatusTimeRef.current > 200) {
            lastStatusTimeRef.current = now;
            onFaceStatusRef.current?.({
              detected: false,
              inGuide: false,
              ratio: null,
              verdict: null,
              countdown: null,
            });
          }
        }
      } catch (err) {
        detectFailCountRef.current++;
        if (detectFailCountRef.current > 30) {
          const now = Date.now();
          if (now - lastStatusTimeRef.current > 1000) {
            lastStatusTimeRef.current = now;
            onFaceStatusRef.current?.({
              detected: false,
              inGuide: false,
              ratio: null,
              verdict: null,
              countdown: null,
            });
          }
          drawNoFaceHint(ctx, canvas.width, canvas.height);
        }
        console.warn("[FaceLandmarker] detectForVideo 실패:", err);
      }

      // 감지 결과와 무관하게 항상 가이드 타원 그리기
      drawGuideEllipse(ctx, canvas.width, canvas.height, faceDetected);

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
  }, [videoRef, canvasRef, landmarkerRef]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const resetState = useCallback(() => {
    capturedRef.current = false;
    countdownRef.current = null;
    ratioBufferRef.current.clear();
  }, []);

  // 수동 캡처
  const manualCapture = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    try {
      const result = landmarker.detectForVideo(video, performance.now());
      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0] as FaceLandmarks;
        const keypoints = extractWillisKeypoints(landmarks);

        let headPose: HeadPose | undefined;
        let ratio: number;
        const imageSize = { width: video.videoWidth, height: video.videoHeight };
        const matrices = result.facialTransformationMatrixes;
        if (matrices && matrices.length > 0) {
          const matrixData = Array.from(matrices[0].data);
          headPose = extractHeadPose(matrixData);
          ratio = calculateCorrectedWillisRatio(keypoints, matrixData, imageSize);
        } else {
          ratio = calculateWillisRatio(keypoints, imageSize);
        }

        // 안정화된 중앙값 사용
        const bufferResult = ratioBufferRef.current.getResult();
        if (bufferResult.isStable) {
          ratio = bufferResult.medianRatio;
        }

        const verdict = assessVD(ratio);

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0);
        }

        capturedRef.current = true;
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);

        onAutoCaptureRef.current?.({
          imageBase64,
          landmarks,
          ratio,
          verdict,
          keypoints,
          headPose,
        });
      } else {
        throw new Error("얼굴이 감지되지 않았습니다. 카메라를 정면으로 바라봐주세요.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "캡처에 실패했습니다. 다시 시도해주세요.";
      throw new Error(msg);
    }
  }, [videoRef, landmarkerRef]);

  return {
    startDetectionLoop,
    stopLoop,
    resetState,
    manualCapture,
    rafRef,
  };
}
