"use client";

import {
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useMediaPipeInit } from "./hooks/useMediaPipeInit";
import { useDetectionLoop } from "./hooks/useDetectionLoop";
import type { FaceStatus, AutoCaptureResult } from "@/lib/mediapipe/types";

export interface FaceLandmarkerViewHandle {
  manualCapture: () => void;
  resetCamera: () => void;
}

interface FaceLandmarkerViewProps {
  onAutoCapture?: (result: AutoCaptureResult) => void;
  onFaceStatus?: (status: FaceStatus) => void;
  onError?: (message: string) => void;
}

export const FaceLandmarkerView = forwardRef<
  FaceLandmarkerViewHandle,
  FaceLandmarkerViewProps
>(function FaceLandmarkerView({ onAutoCapture, onFaceStatus, onError }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // onError 최신 ref
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // startDetectionLoop을 ref로 보관하여 선언 순서 문제 해결
  const startDetectionLoopRef = useRef<() => void>(() => {});

  const {
    videoRef,
    landmarkerRef,
    isLoading,
    loadingMessage,
    initError,
  } = useMediaPipeInit(
    () => startDetectionLoopRef.current(),
    (msg) => onErrorRef.current?.(msg),
  );

  const {
    startDetectionLoop,
    resetState,
    manualCapture: doManualCapture,
  } = useDetectionLoop({
    videoRef,
    canvasRef,
    landmarkerRef,
    onAutoCapture,
    onFaceStatus,
  });

  // ref에 최신 startDetectionLoop 반영
  useEffect(() => { startDetectionLoopRef.current = startDetectionLoop; }, [startDetectionLoop]);

  const manualCapture = useCallback(() => {
    try {
      doManualCapture();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "캡처에 실패했습니다.";
      onErrorRef.current?.(msg);
    }
  }, [doManualCapture]);

  const resetCamera = useCallback(() => {
    resetState();
    startDetectionLoop();
  }, [resetState, startDetectionLoop]);

  useImperativeHandle(ref, () => ({
    manualCapture,
    resetCamera,
  }));

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full min-h-[60dvh] bg-black">
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
            className="mt-4 rounded-xl bg-white/10 border border-white/15 px-6 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/15"
            onClick={handleRetry}
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
});
