import { useState, useCallback, useRef } from "react";
import type { FaceLandmarkerViewHandle } from "@/components/mediapipe/FaceLandmarkerView";
import type { AutoCaptureResult } from "@/lib/mediapipe/types";

type StepPhase = "live" | "result";

interface UsePhotoCaptureOptions {
  onConfirm: (result: AutoCaptureResult) => void;
}

export function usePhotoCapture({ onConfirm }: UsePhotoCaptureOptions) {
  const [phase, setPhase] = useState<StepPhase>("live");
  const [captureResult, setCaptureResult] = useState<AutoCaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerViewHandle>(null);

  const handleAutoCapture = useCallback((result: AutoCaptureResult) => {
    setCaptureResult(result);
    setPhase("result");
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleRetake = useCallback(() => {
    setCaptureResult(null);
    setError(null);
    setPhase("live");
    landmarkerRef.current?.resetCamera();
  }, []);

  const handleConfirm = useCallback(() => {
    if (!captureResult) return;
    onConfirm(captureResult);
  }, [captureResult, onConfirm]);

  return {
    phase,
    captureResult,
    error,
    landmarkerRef,
    handleAutoCapture,
    handleError,
    handleRetake,
    handleConfirm,
  };
}
