"use client";

import { useAssessmentStore } from "@/lib/store/assessmentStore";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

export function StepVDDetector() {
  const { nextStep, prevStep, initialPhoto } = useAssessmentStore();

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col px-6 pt-6">
      {/* 1단계 결과 요약 */}
      {initialPhoto && (
        <div className="glass shadow-glass rounded-2xl p-4">
          <span className="text-sm font-semibold text-foreground">
            1단계 결과
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Willis 비율</span>
            <span className="text-lg font-bold text-primary-600">
              {initialPhoto.willisRatio?.toFixed(3)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">판정</span>
            <span
              className={`text-lg font-bold ${
                initialPhoto.verdict === "NORMAL"
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {initialPhoto.verdict}
            </span>
          </div>
        </div>
      )}

      {/* VD Detector 가이드 */}
      <div className="mt-6 flex flex-1 flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100/60 backdrop-blur-sm">
          <Wrench className="size-8 text-primary-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-foreground">
          2단계: VD Detector 장착
        </h3>
        <p className="mt-3 text-center text-sm leading-5 text-muted-foreground">
          1. VD detector를 환자에게 장착합니다
          <br />
          2. 적절한 교합 높이로 조절합니다
          <br />
          3. 환자가 편안한 상태인지 확인합니다
        </p>
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-3 pb-8">
        <Button
          variant="outline"
          className="flex-1 rounded-2xl py-6 text-base font-semibold"
          onClick={prevStep}
        >
          이전
        </Button>
        <Button
          className="flex-1 rounded-2xl py-6 text-base font-bold"
          onClick={nextStep}
        >
          다음 단계
        </Button>
      </div>
    </div>
  );
}
