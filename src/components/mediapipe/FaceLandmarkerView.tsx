"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { LANDMARK_INDICES } from "@/lib/mediapipe/landmarkIndices";
import { calculateWillisRatio, calculateCorrectedWillisRatio } from "@/lib/willis/calculateRatio";
import { assessVD } from "@/lib/willis/assessVD";
import { extractHeadPose, validateHeadPose, getPoseHintMessage } from "@/lib/mediapipe/headPose";
import { createRatioBuffer } from "@/lib/willis/ratioBuffer";
import type {
  FaceLandmarks,
  WillisKeypoints,
  FaceStatus,
  AutoCaptureResult,
  NormalizedLandmark,
  HeadPose,
} from "@/lib/mediapipe/types";

// 동적 import 타입 (runtime 용)
type FaceLandmarkerType = import("@mediapipe/tasks-vision").FaceLandmarker;

export interface FaceLandmarkerViewHandle {
  manualCapture: () => void;
  resetCamera: () => void;
}

interface FaceLandmarkerViewProps {
  onAutoCapture?: (result: AutoCaptureResult) => void;
  onFaceStatus?: (status: FaceStatus) => void;
  onError?: (message: string) => void;
}

// 478 랜드마크에서 Willis 키포인트 추출
function extractWillisKeypoints(landmarks: NormalizedLandmark[]): WillisKeypoints {
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

// 얼굴이 가이드 타원 안에 있는지 확인
function checkFaceInGuide(landmarks: NormalizedLandmark[]): boolean {
  const ys = landmarks.map((l) => l.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const faceHeight = maxY - minY;
  if (faceHeight < 0.25 || faceHeight > 0.65) return false;

  const xs = landmarks.map((l) => l.x);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (minY + maxY) / 2;
  if (Math.abs(centerX - 0.5) > 0.15) return false;
  if (Math.abs(centerY - 0.45) > 0.15) return false;

  const leftPupil = landmarks[LANDMARK_INDICES.LEFT_IRIS_CENTER];
  const rightPupil = landmarks[LANDMARK_INDICES.RIGHT_IRIS_CENTER];
  const dx = rightPupil.x - leftPupil.x;
  const dy = rightPupil.y - leftPupil.y;
  const tiltDeg = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  if (tiltDeg > 5) return false;

  return true;
}

export const FaceLandmarkerView = forwardRef<
  FaceLandmarkerViewHandle,
  FaceLandmarkerViewProps
>(function FaceLandmarkerView({ onAutoCapture, onFaceStatus, onError }, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerType | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const countdownRef = useRef<number | null>(null);
  const countdownStartRef = useRef<number>(0);
  const lastStatusTimeRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("MediaPipe 초기화 중...");
  const [initError, setInitError] = useState<string | null>(null);
  const capturedRef = useRef(false);

  // 콜백 ref로 클로저 문제 해결
  const onFaceStatusRef = useRef(onFaceStatus);
  const onAutoCaptureRef = useRef(onAutoCapture);
  const onErrorRef = useRef(onError);
  useEffect(() => { onFaceStatusRef.current = onFaceStatus; }, [onFaceStatus]);
  useEffect(() => { onAutoCaptureRef.current = onAutoCapture; }, [onAutoCapture]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // 감지 실패 카운터
  const detectFailCountRef = useRef(0);

  // 비율 안정화 링 버퍼
  const ratioBufferRef = useRef(createRatioBuffer(10));

  // 감지 루프 ref (resetCamera에서 호출 가능하도록)
  const startDetectionLoopRef = useRef<() => void>(() => {});

  // MediaPipe 초기화 + 감지 루프
  useEffect(() => {
    let cancelled = false;

    // 감지 루프 정의 (ref 기반 콜백 사용으로 클로저 문제 해결)
    const startDetectionLoop = () => {
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

        // 감지 결과와 무관하게 항상 가이드 타원 그리기
        drawGuideEllipse(ctx, canvas.width, canvas.height);

        // 이미 캡처된 경우 루프 중지
        if (capturedRef.current) return;

        try {
          const result = landmarker.detectForVideo(video, performance.now());
          detectFailCountRef.current = 0; // 성공 시 카운터 리셋

          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
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

              // 보정된 비율 계산
              ratio = calculateCorrectedWillisRatio(keypoints, matrixData, imageSize);
            } else {
              // 폴백: 보정 없이 계산
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

              drawCountdown(ctx, canvas.width, canvas.height, countdownRef.current);
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
          // ~5초간 계속 실패 시 (30프레임 ≈ 5초) 사용자에게 안내
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
            // 미감지 안내 메시지 그리기
            drawNoFaceHint(ctx, canvas.width, canvas.height);
          }
          console.warn("[FaceLandmarker] detectForVideo 실패:", err);
        }

        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);
    };

    startDetectionLoopRef.current = startDetectionLoop;

    async function init() {
      try {
        setLoadingMessage("MediaPipe 모델 로딩 중...");
        const { FaceLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        if (cancelled) return;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (cancelled) return;

        // GPU → CPU 폴백
        const MODEL_PATH =
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
        const commonOpts = {
          runningMode: "VIDEO" as const,
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        };

        let faceLandmarker: FaceLandmarkerType;
        try {
          faceLandmarker = await FaceLandmarker.createFromOptions(
            filesetResolver,
            {
              ...commonOpts,
              baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" },
            }
          );
        } catch {
          // GPU 실패 시 CPU로 재시도 (모바일 Safari 호환)
          setLoadingMessage("CPU 모드로 전환 중...");
          faceLandmarker = await FaceLandmarker.createFromOptions(
            filesetResolver,
            {
              ...commonOpts,
              baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
            }
          );
        }

        if (cancelled) return;
        landmarkerRef.current = faceLandmarker;

        // 카메라 시작
        setLoadingMessage("카메라 접근 중...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // autoPlay 속성이 처리 — iOS Safari에서 play() 실패 시 무시
          }
        }

        setIsLoading(false);
        startDetectionLoop();
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : "MediaPipe 초기화에 실패했습니다.";
          onErrorRef.current?.(msg);
          setInitError(msg);
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
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

        // Head Pose 보정 적용
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

        // 안정화된 중앙값 사용 (버퍼에 값이 있으면)
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
        onErrorRef.current?.("얼굴이 감지되지 않았습니다. 카메라를 정면으로 바라봐주세요.");
      }
    } catch {
      onErrorRef.current?.("캡처에 실패했습니다. 다시 시도해주세요.");
    }
  }, []);

  // 카메라 리셋
  const resetCamera = useCallback(() => {
    capturedRef.current = false;
    countdownRef.current = null;
    ratioBufferRef.current.clear();
    startDetectionLoopRef.current();
  }, []);

  useImperativeHandle(ref, () => ({
    manualCapture,
    resetCamera,
  }));

  // 재시도
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full min-h-[60dvh] bg-black">
      {/* video는 숨김 처리 (canvas가 미러링된 영상을 그림) */}
      <video
        ref={videoRef}
        className="pointer-events-none absolute opacity-0"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 h-full w-full object-cover"
      />
      {isLoading && (
        <div className="glass-dark absolute inset-0 z-20 flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          <span className="mt-3 text-sm text-white/80">{loadingMessage}</span>
        </div>
      )}
      {initError && !isLoading && (
        <div className="glass-dark absolute inset-0 z-20 flex flex-col items-center justify-center">
          <p className="px-6 text-center text-sm text-red-400">{initError}</p>
          <button
            className="mt-4 rounded-2xl bg-white px-6 py-2 text-sm font-semibold text-gray-800"
            onClick={handleRetry}
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
});

// === 오버레이 그리기 유틸 ===

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  keypoints: WillisKeypoints,
  width: number,
  height: number,
  ratio: number,
  verdict: "NORMAL" | "LOWER"
) {
  // 미러링 보정: x → 1 - x
  const mirror = (lm: NormalizedLandmark) => ({
    x: (1 - lm.x) * width,
    y: lm.y * height,
  });

  const leftPupil = mirror(keypoints.leftPupil);
  const rightPupil = mirror(keypoints.rightPupil);
  const pupilMid = {
    x: (leftPupil.x + rightPupil.x) / 2,
    y: (leftPupil.y + rightPupil.y) / 2,
  };
  const rimaOris = mirror(keypoints.rimaOris);
  const subnasale = mirror(keypoints.subnasale);
  const chin = mirror(keypoints.chin);

  // 동공간선 (파란색 점선)
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = "rgba(96, 165, 250, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftPupil.x, leftPupil.y);
  ctx.lineTo(rightPupil.x, rightPupil.y);
  ctx.stroke();

  // 동공~구열 거리 (녹색 실선)
  ctx.setLineDash([]);
  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pupilMid.x, pupilMid.y);
  ctx.lineTo(rimaOris.x, rimaOris.y);
  ctx.stroke();

  // 비하점~턱끝 거리 (주황 실선)
  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(subnasale.x, subnasale.y);
  ctx.lineTo(chin.x, chin.y);
  ctx.stroke();

  // 키포인트 원
  const points = [
    { p: leftPupil, color: "#60A5FA", r: 4 },
    { p: rightPupil, color: "#60A5FA", r: 4 },
    { p: rimaOris, color: "#22C55E", r: 4 },
    { p: subnasale, color: "#F59E0B", r: 4 },
    { p: chin, color: "#F59E0B", r: 4 },
  ];
  for (const { p, color, r } of points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 비율 표시 (상단)
  const color = verdict === "NORMAL" ? "#22C55E" : "#EF4444";
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(width / 2 - 60, 10, 120, 36);
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(ratio.toFixed(3), width / 2, 34);
}

// 가이드 타원 (감지 결과와 무관하게 항상 표시)
function drawGuideEllipse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(width / 2, height * 0.45, width * 0.3, height * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// 얼굴 미감지 안내 메시지
function drawNoFaceHint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  const boxW = Math.min(280, width * 0.7);
  const boxH = 40;
  ctx.fillRect(width / 2 - boxW / 2, height * 0.8, boxW, boxH);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("얼굴을 타원 안에 위치시켜 주세요", width / 2, height * 0.8 + boxH / 2);
}

// 자세 교정 안내 메시지
function drawPoseHint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pose: HeadPose
) {
  const message = getPoseHintMessage(pose);
  if (!message) return;

  ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
  const boxW = Math.min(300, width * 0.75);
  const boxH = 36;
  const boxX = width / 2 - boxW / 2;
  const boxY = height * 0.12;

  // 라운드 사각형
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(boxX + r, boxY);
  ctx.lineTo(boxX + boxW - r, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
  ctx.lineTo(boxX + boxW, boxY + boxH - r);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
  ctx.lineTo(boxX + r, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
  ctx.lineTo(boxX, boxY + r);
  ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
  ctx.closePath();
  ctx.fill();

  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, width / 2, boxY + boxH / 2);
}

function drawCountdown(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seconds: number
) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(width / 2 - 30, height / 2 - 30, 60, 60);
  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(Math.ceil(seconds).toString(), width / 2, height / 2);
}
