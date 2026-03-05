"use client";

import Link from "next/link";
import { CnalyticsLogo } from "@/components/brand/CnalyticsLogo";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl overflow-auto px-6 pt-8 pb-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <CnalyticsLogo variant="icon" size={52} />
        <div>
          <h1 className="text-3xl font-bold text-foreground">VD Assessment</h1>
          <p className="text-sm text-muted-foreground">
            Willis 안면 비율법 기반 VD 평가
          </p>
        </div>
      </div>

      {/* 새 평가 시작 버튼 */}
      <Link
        href="/assess"
        className="mt-8 block rounded-3xl bg-gradient-to-br from-primary-600 to-primary-500 px-6 py-6 text-center shadow-glass-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="text-lg font-bold text-white">새 VD 평가 시작</span>
        <span className="mt-1 block text-sm text-white/70">
          환자 얼굴 촬영 → Willis 비율 분석
        </span>
      </Link>

      {/* 정보 카드 그리드 */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass glass-texture glass-lift shadow-glass rounded-2xl p-5">
          <h2 className="text-base font-semibold text-foreground">
            Willis 비율이란?
          </h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            동공~비하점 거리와 비하점~턱끝 거리의 비율로
            <br />
            VD(Vertical Dimension) 상태를 판정합니다.
          </p>
          <div className="mt-4 flex justify-between">
            <InfoChip label="정상 범위" value="0.9~1.5" />
            <InfoChip label="범위 내" value="Normal" color="text-success" />
            <InfoChip label="범위 밖" value="Lower" color="text-danger" />
          </div>
        </div>

        <div className="glass glass-texture glass-lift shadow-glass rounded-2xl p-5">
          <h2 className="text-base font-semibold text-foreground">
            평가 워크플로우
          </h2>
          <div className="mt-3 space-y-3">
            <StepPreview step={1} title="초기 사진 촬영" desc="Willis 비율 측정" />
            <StepPreview step={2} title="VD Detector 장착" desc="교합 높이 조절" />
            <StepPreview step={3} title="검증 사진 촬영" desc="전후 비교" />
            <StepPreview step={4} title="인상채득" desc="최종 기록" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
  color = "text-primary-600",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`mt-1 text-base font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StepPreview({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-row items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100/60 backdrop-blur-sm">
        <span className="text-sm font-bold text-primary-700">{step}</span>
      </div>
      <div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
