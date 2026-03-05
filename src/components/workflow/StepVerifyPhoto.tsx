"use client";

import { useState, useCallback, useRef } from "react";
import { useAssessmentStore } from "@/lib/store/assessmentStore";
import { WillisRatioGauge } from "../assessment/WillisRatioGauge";
import { VDResultCard } from "../assessment/VDResultCard";
import { BeforeAfterView } from "../assessment/BeforeAfterView";
import {
  FaceLandmarkerView,
  type FaceLandmarkerViewHandle,
} from "../mediapipe/FaceLandmarkerView";
import type { AutoCaptureResult } from "@/lib/mediapipe/types";
import { Button } from "@/components/ui/button";

type StepPhase = "live" | "result";

export function StepVerifyPhoto() {
  const { nextStep, prevStep, setVerifyPhoto, initialPhoto } =
    useAssessmentStore();
  const [phase, setPhase] = useState<StepPhase>("live");
  const [captureResult, setCaptureResult] =
    useState<AutoCaptureResult | null>(null);
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

    setVerifyPhoto({
      uri: captureResult.imageBase64,
      base64: captureResult.imageBase64,
      keypoints: {
        leftPupil: captureResult.keypoints.leftPupil,
        rightPupil: captureResult.keypoints.rightPupil,
        subnasale: captureResult.keypoints.subnasale,
        rimaOris: captureResult.keypoints.rimaOris,
        chin: captureResult.keypoints.chin,
      },
      willisRatio: captureResult.ratio,
      verdict: captureResult.verdict,
      timestamp: Date.now(),
    });
    nextStep();
  }, [captureResult, setVerifyPhoto, nextStep]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {phase === "live" && (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="relative min-h-0 flex-1 lg:flex-[3]">
              <FaceLandmarkerView
                ref={landmarkerRef}
                onAutoCapture={handleAutoCapture}
                onError={handleError}
              />

              {/* 이전 버튼 */}
              <button
                className="glass-heavy absolute top-4 left-4 rounded-2xl px-4 py-2 text-sm text-white hover:bg-white/30"
                onClick={prevStep}
              >
                ← 이전
              </button>

              {/* 수동 캡처 버튼 */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  className="glass-heavy shadow-glass-lg flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
                  onClick={() => landmarkerRef.current?.manualCapture()}
                >
                  <div className="h-12 w-12 rounded-full bg-white" />
                </button>
              </div>

              {error && (
                <div className="absolute top-4 right-4 left-16 rounded-2xl bg-red-600/90 px-4 py-3">
                  <p className="text-center text-sm text-white">{error}</p>
                </div>
              )}
            </div>

            {/* 태블릿+ 우측 패널 */}
            <div className="glass-heavy hidden p-6 lg:flex lg:w-80 lg:flex-col lg:justify-center">
              <h3 className="text-lg font-bold text-foreground">
                3단계: 검증 촬영
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                VD Detector 장착 후
                <br />
                다시 촬영합니다.
              </p>
              {initialPhoto && (
                <div className="glass shadow-glass mt-4 rounded-2xl p-3">
                  <span className="text-xs text-muted-foreground">초기 비율</span>
                  <p className="text-lg font-bold text-primary-600">
                    {initialPhoto.willisRatio?.toFixed(3)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "result" && captureResult && (
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-6 pt-4 lg:flex lg:gap-8">
            {/* 좌측: 전후비교 + 사진 */}
            <div className="lg:flex-1">
              <h3 className="text-lg font-bold text-foreground">3단계 결과</h3>

              {initialPhoto && (
                <div className="mt-4">
                  <BeforeAfterView
                    before={initialPhoto}
                    after={{
                      uri: captureResult.imageBase64,
                      willisRatio: captureResult.ratio,
                      verdict: captureResult.verdict,
                      timestamp: Date.now(),
                    }}
                  />
                </div>
              )}

              <div className="relative mt-4 overflow-hidden rounded-2xl">
                <img
                  src={captureResult.imageBase64}
                  alt="검증 촬영 결과"
                  className="h-48 w-full object-cover lg:h-64"
                />
              </div>
            </div>

            {/* 우측: 게이지 + 카드 + 버튼 */}
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
