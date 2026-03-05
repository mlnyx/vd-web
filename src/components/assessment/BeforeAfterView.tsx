import type { PhotoResult } from "@/lib/store/assessmentStore";
import { isNormalRange } from "@/lib/willis/assessVD";
import { ArrowRight } from "lucide-react";

interface BeforeAfterViewProps {
  before: PhotoResult;
  after: PhotoResult;
}

export function BeforeAfterView({ before, after }: BeforeAfterViewProps) {
  const ratioDiff = (after.willisRatio ?? 0) - (before.willisRatio ?? 0);

  return (
    <div className="glass glass-texture shadow-glass rounded-2xl p-4">
      <span className="text-base font-semibold text-foreground">전후 비교</span>

      <div className="mt-3 flex gap-3">
        {/* Before */}
        <div className="flex flex-1 flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground">BEFORE</span>
          {before.uri ? (
            <img
              src={before.uri}
              alt="before"
              className="mt-2 h-28 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="mt-2 flex h-28 w-full items-center justify-center rounded-xl bg-muted">
              <span className="text-muted-foreground">사진 없음</span>
            </div>
          )}
          <span
            className={`mt-2 text-xl font-bold ${
              isNormalRange(before.willisRatio ?? 0)
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {before.willisRatio?.toFixed(3) ?? "-"}
          </span>
          <span
            className={`text-xs font-semibold ${
              before.verdict === "NORMAL" ? "text-green-500" : "text-red-500"
            }`}
          >
            {before.verdict ?? "-"}
          </span>
        </div>

        {/* 화살표 + 변화량 */}
        <div className="flex flex-col items-center justify-center">
          <ArrowRight className="size-6 text-muted-foreground/50" />
          {ratioDiff !== 0 && (
            <span
              className={`mt-1 text-xs font-bold ${
                ratioDiff > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {ratioDiff > 0 ? "+" : ""}
              {ratioDiff.toFixed(3)}
            </span>
          )}
        </div>

        {/* After */}
        <div className="flex flex-1 flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground">AFTER</span>
          {after.uri ? (
            <img
              src={after.uri}
              alt="after"
              className="mt-2 h-28 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="mt-2 flex h-28 w-full items-center justify-center rounded-xl bg-muted">
              <span className="text-muted-foreground">사진 없음</span>
            </div>
          )}
          <span
            className={`mt-2 text-xl font-bold ${
              isNormalRange(after.willisRatio ?? 0)
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {after.willisRatio?.toFixed(3) ?? "-"}
          </span>
          <span
            className={`text-xs font-semibold ${
              after.verdict === "NORMAL" ? "text-green-500" : "text-red-500"
            }`}
          >
            {after.verdict ?? "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
