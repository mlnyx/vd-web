import type { VDVerdict } from "@/lib/store/assessmentStore";
import { getDetailedAssessment, isNormalRange } from "@/lib/willis/assessVD";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface VDResultCardProps {
  ratio: number;
  verdict: VDVerdict;
}

export function VDResultCard({ ratio, verdict }: VDResultCardProps) {
  const detail = getDetailedAssessment(ratio);
  const isNormal = isNormalRange(ratio);

  return (
    <div
      className={`glass glass-texture shadow-glass rounded-2xl p-4 ${
        isNormal
          ? "bg-success/10"
          : "bg-danger/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isNormal ? (
            <CheckCircle2 className="size-7 text-success" />
          ) : (
            <AlertTriangle className="size-7 text-danger" />
          )}
          <div>
            <span
              className={`text-lg font-bold ${
                isNormal ? "text-green-700" : "text-red-700"
              }`}
            >
              {verdict === "NORMAL" ? "Normal" : "Lower"}
            </span>
            <p
              className={`text-xs ${
                isNormal ? "text-green-600" : "text-red-600"
              }`}
            >
              {detail.message}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-2xl font-bold ${
              isNormal ? "text-green-600" : "text-red-600"
            }`}
          >
            {ratio.toFixed(3)}
          </span>
          <p className="text-xs text-muted-foreground">
            편차: {detail.deviation > 0 ? "+" : ""}
            {detail.deviation.toFixed(3)}
          </p>
        </div>
      </div>
    </div>
  );
}
