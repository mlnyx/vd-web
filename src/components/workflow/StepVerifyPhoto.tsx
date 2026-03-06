"use client";

import { useCallback, useMemo } from "react";
import { useAssessmentStore } from "@/lib/store/assessmentStore";
import { usePhotoCapture } from "@/lib/hooks/usePhotoCapture";
import { WillisRatioGauge } from "../assessment/WillisRatioGauge";
import { VDResultCard } from "../assessment/VDResultCard";
import { BeforeAfterView } from "../assessment/BeforeAfterView";
import { FaceLandmarkerView } from "../mediapipe/FaceLandmarkerView";
import type { AutoCaptureResult } from "@/lib/mediapipe/types";
import { Button } from "@/components/ui/button";

export function StepVerifyPhoto() {
  const { nextStep, prevStep, setVerifyPhoto, initialPhoto } =
    useAssessmentStore();

  const onConfirm = useCallback(
    (result: AutoCaptureResult) => {
      setVerifyPhoto({
        uri: result.imageBase64,
        base64: result.imageBase64,
        keypoints: {
          leftPupil: result.keypoints.leftPupil,
          rightPupil: result.keypoints.rightPupil,
          subnasale: result.keypoints.subnasale,
          rimaOris: result.keypoints.rimaOris,
          chin: result.keypoints.chin,
        },
        willisRatio: result.ratio,
        verdict: result.verdict,
        timestamp: Date.now(),
      });
      nextStep();
    },
    [setVerifyPhoto, nextStep]
  );

  const {
    phase,
    captureResult,
    error,
    landmarkerRef,
    handleAutoCapture,
    handleError,
    handleRetake,
    handleConfirm,
  } = usePhotoCapture({ onConfirm });

  const afterPhoto = useMemo(() => {
    if (!captureResult) return null;
    return {
      uri: captureResult.imageBase64,
      willisRatio: captureResult.ratio,
      verdict: captureResult.verdict,
      timestamp: 0,
    };
  }, [captureResult]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {phase === "live" && (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <FaceLandmarkerView
              ref={landmarkerRef}
              onAutoCapture={handleAutoCapture}
              onError={handleError}
            />

            {/* 이전 버튼 */}
            <button
              className="absolute top-4 left-4 z-20 rounded-xl bg-black/50 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm border border-white/10 hover:bg-white/10"
              onClick={prevStep}
            >
              ← 이전
            </button>

            {/* 수동 캡처 버튼 */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-white/30 bg-black/40 backdrop-blur-sm transition-transform hover:scale-105 active:scale-90"
                onClick={() => landmarkerRef.current?.manualCapture()}
              >
                <div className="h-[54px] w-[54px] rounded-full bg-white" />
              </button>
            </div>

            {error && (
              <div className="absolute top-4 right-4 left-16 rounded-2xl bg-red-600/90 px-4 py-3">
                <p className="text-center text-sm text-white">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "result" && captureResult && (
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-6 pt-4 lg:flex lg:gap-8">
            <div className="lg:flex-1">
              <h3 className="text-lg font-bold text-foreground">3단계 결과</h3>

              {initialPhoto && afterPhoto && (
                <div className="mt-4">
                  <BeforeAfterView
                    before={initialPhoto}
                    after={afterPhoto}
                  />
                </div>
              )}

              <div className="relative mt-4 overflow-hidden rounded-2xl">
                <img
                  src={captureResult.imageBase64}
                  alt="검증 촬영 결과"
                  className="h-48 w-full object-cover lg:h-64 border border-white/5"
                />
              </div>
            </div>

            <div className="lg:w-80">
              <div className="mt-4 flex justify-center lg:mt-0">
                <WillisRatioGauge ratio={captureResult.ratio} size={130} />
              </div>

              <div className="mt-3">
                <VDResultCard
                  ratio={captureResult.ratio}
                  verdict={captureResult.verdict}
                />
              </div>

              <div className="mt-6 space-y-3 pb-8">
                <Button
                  className="w-full rounded-2xl py-6 text-base font-bold"
                  onClick={handleConfirm}
                >
                  결과 확인, 다음 단계로
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl py-6 text-base font-semibold"
                  onClick={handleRetake}
                >
                  다시 촬영
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
