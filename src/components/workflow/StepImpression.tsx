"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/store/assessmentStore";
import { BeforeAfterView } from "../assessment/BeforeAfterView";
import { saveAssessment } from "@/lib/db/repository";
import { shareResult } from "@/lib/share/shareResult";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function StepImpression() {
  const router = useRouter();
  const { initialPhoto, verifyPhoto, patientId, notes, prevStep, reset } =
    useAssessmentStore();
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    const photo = verifyPhoto ?? initialPhoto;
    if (!photo?.base64 || !photo.willisRatio || !photo.verdict) return;

    setSharing(true);
    try {
      const success = await shareResult({
        imageBase64: photo.base64,
        ratio: photo.willisRatio,
        verdict: photo.verdict,
      });
      if (!success) {
        toast.info("이미지가 다운로드됩니다.");
      }
    } catch {
      toast.error("결과를 공유하지 못했습니다.");
    } finally {
      setSharing(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await saveAssessment({
        patientId: patientId ?? undefined,
        initialPhoto,
        verifyPhoto,
        notes,
      });
      reset();
      router.push("/");
    } catch {
      toast.error("평가 결과를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl flex-1 overflow-auto px-6 pt-6">
      <h3 className="text-xl font-bold text-foreground">4단계: 인상채득</h3>

      {/* 전후 비교 */}
      {initialPhoto && verifyPhoto && (
        <div className="mt-4">
          <BeforeAfterView before={initialPhoto} after={verifyPhoto} />
        </div>
      )}

      {/* 초기 결과만 있는 경우 */}
      {initialPhoto && !verifyPhoto && (
        <div className="glass shadow-glass mt-4 rounded-2xl p-4">
          <span className="text-base font-semibold text-foreground">
            초기 촬영 결과
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Willis 비율</span>
            <span className="text-lg font-bold text-primary-600">
              {initialPhoto.willisRatio?.toFixed(3) ?? "-"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">판정</span>
            <span
              className={`text-lg font-bold ${
                initialPhoto.verdict === "NORMAL"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {initialPhoto.verdict}
            </span>
          </div>
        </div>
      )}

      {/* 인상채득 절차 */}
      <div className="glass shadow-glass mt-6 rounded-2xl p-4">
        <span className="text-base font-semibold text-foreground">
          인상채득 절차
        </span>
        <div className="mt-3 space-y-3">
          <ProcedureItem
            step={1}
            title="트레이 선택"
            desc="환자 구강에 맞는 트레이를 선택합니다"
          />
          <ProcedureItem
            step={2}
            title="인상재 혼합"
            desc="알지네이트 인상재를 적절히 혼합합니다"
          />
          <ProcedureItem
            step={3}
            title="인상 채득"
            desc="VD Detector 장착 상태에서 인상을 채득합니다"
          />
          <ProcedureItem
            step={4}
            title="경화 대기"
            desc="인상재가 완전히 경화될 때까지 대기합니다"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="mt-6 space-y-3 pb-8">
        <Button
          className="w-full rounded-2xl py-6 text-base font-bold"
          onClick={handleShare}
          disabled={sharing}
        >
          {sharing ? "공유 준비 중..." : "결과 공유"}
        </Button>
        <Button
          className="w-full rounded-2xl bg-gradient-to-br from-green-600 to-green-500 py-6 text-base font-bold text-white shadow-glass hover:brightness-110"
          onClick={handleComplete}
          disabled={saving}
        >
          {saving ? "저장 중..." : "평가 완료 및 저장"}
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-2xl py-6 text-base font-semibold"
          onClick={prevStep}
          disabled={saving}
        >
          이전 단계로
        </Button>
      </div>
    </div>
  );
}

function ProcedureItem({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100/60 backdrop-blur-sm">
        <span className="text-xs font-bold text-primary-700">{step}</span>
      </div>
      <div className="flex-1">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
