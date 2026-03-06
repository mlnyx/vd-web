import { memo } from "react";
import { WILLIS_RANGE_MIN, WILLIS_RANGE_MAX, isNormalRange } from "@/lib/willis/assessVD";

interface WillisRatioGaugeProps {
  ratio: number;
  size?: number;
}

export const WillisRatioGauge = memo(function WillisRatioGauge({ ratio, size = 160 }: WillisRatioGaugeProps) {
  const normal = isNormalRange(ratio);
  const center = size / 2;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  // 비율을 0.5~2.0 범위로 매핑
  const minRatio = 0.5;
  const maxRatio = 2.0;
  const normalizedRatio = Math.max(
    0,
    Math.min(1, (ratio - minRatio) / (maxRatio - minRatio))
  );
  const strokeDashoffset = circumference * (1 - normalizedRatio * 0.75);

  // 정상 범위 아크 계산 (0.9~1.5 구간)
  const normalStart = Math.max(0, (WILLIS_RANGE_MIN - minRatio) / (maxRatio - minRatio));
  const normalEnd = Math.min(1, (WILLIS_RANGE_MAX - minRatio) / (maxRatio - minRatio));
  const normalArcStart = normalStart * 0.75;
  const normalArcEnd = normalEnd * 0.75;
  const normalArcLength = (normalArcEnd - normalArcStart) * circumference;
  const normalArcOffset = circumference * (1 - normalArcEnd);

  const color = normal ? "#22C55E" : "#EF4444";

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* 배경 원 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="oklch(0.3 0 0 / 50%)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(-135, ${center}, ${center})`}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          />
          {/* 정상 구간 하이라이트 (녹색 밴드) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(0, 214, 143, 0.15)"
            strokeWidth="10"
            fill="none"
            transform={`rotate(-135, ${center}, ${center})`}
            strokeDasharray={`${normalArcLength} ${circumference - normalArcLength}`}
            strokeDashoffset={normalArcOffset}
          />
          {/* 게이지 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(-135, ${center}, ${center})`}
            strokeDasharray={String(circumference)}
            strokeDashoffset={strokeDashoffset}
          />
          {/* 중앙 비율 텍스트 */}
          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize="28"
            fontWeight="bold"
          >
            {ratio.toFixed(3)}
          </text>
          <text
            x={center}
            y={center + 18}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#9EA4AE"
            fontSize="12"
          >
            Willis 비율
          </text>
        </svg>
      </div>
      <span className="mt-1 text-xs text-muted-foreground">
        정상 범위: {WILLIS_RANGE_MIN} ~ {WILLIS_RANGE_MAX}
      </span>
    </div>
  );
});
