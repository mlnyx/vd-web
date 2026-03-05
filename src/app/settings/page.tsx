"use client";

import { WILLIS_RANGE_MIN, WILLIS_RANGE_MAX } from "@/lib/willis/assessVD";
import { CnalyticsLogo } from "@/components/brand/CnalyticsLogo";

const FEEDBACK_URL = "https://forms.gle/BWv3NgoutNk3hUFu9";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl overflow-auto px-6 pt-4 pb-8">
      <h1 className="mb-4 text-xl font-bold text-foreground">설정</h1>

      <div className="glass shadow-glass rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground">앱 정보</h2>
        <div className="mt-3 flex items-center gap-3">
          <CnalyticsLogo variant="icon" size={36} />
          <div>
            <span className="text-sm font-semibold text-foreground">Cnalytics VD Assessment</span>
            <p className="text-xs text-muted-foreground">v1.0.0 (Web) · Next.js + React</p>
          </div>
        </div>
      </div>

      <div className="glass shadow-glass mt-4 rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground">판정 기준</h2>
        <div className="mt-3 space-y-2">
          <SettingRow label="판정 방법" value="Willis 안면 비율법" />
          <SettingRow
            label="정상 범위"
            value={`${WILLIS_RANGE_MIN} ≤ ratio ≤ ${WILLIS_RANGE_MAX}`}
          />
          <SettingRow label="범위 내" value="Normal (정상)" />
          <SettingRow label="범위 밖" value="Lower (VD 부족)" />
        </div>
      </div>

      <div className="glass shadow-glass mt-4 rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground">
          랜드마크 엔진
        </h2>
        <div className="mt-3 space-y-2">
          <SettingRow label="엔진" value="MediaPipe Face Landmarker" />
          <SettingRow label="포인트" value="478 랜드마크" />
          <SettingRow label="핵심 키포인트" value="동공, 비하점, 구렬, 턱끝" />
          <SettingRow label="홍채 감지" value="refineLandmarks: true" />
        </div>
      </div>

      <div className="glass shadow-glass mt-4 rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground">참고 문헌</h2>
        <div className="mt-3 space-y-1">
          <p className="text-sm text-muted-foreground">
            김수현, &quot;Willis 안면 비율법을 이용한 VD 평가&quot;
          </p>
          <p className="text-xs text-muted-foreground/70">전남대학교 대학원, 2025</p>
        </div>
      </div>

      <div className="glass shadow-glass mt-4 rounded-2xl bg-primary-100/20 p-4">
        <h2 className="text-base font-semibold text-foreground">피드백</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          앱 사용 중 불편한 점이나 개선 의견을 보내주세요.
        </p>
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glass transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          피드백 보내기
        </a>
      </div>

      <div className="glass shadow-glass mt-4 rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground">촬영 가이드</h2>
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            • 밝은 환경에서 촬영해주세요
          </p>
          <p className="text-sm text-muted-foreground">
            • 정면을 바라보고 촬영해주세요
          </p>
          <p className="text-sm text-muted-foreground">
            • 동공간선 기울기가 ±5° 이내여야 정확합니다
          </p>
          <p className="text-sm text-muted-foreground">
            • 크롭된 정면 얼굴 사진이 최고 성능 (90% 정확도)
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
