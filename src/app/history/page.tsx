"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAllAssessments, type AssessmentRecord } from "@/lib/db/repository";
import { isNormalRange } from "@/lib/willis/assessVD";
import { ClipboardList } from "lucide-react";

export default function HistoryPage() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getAllAssessments();
      setAssessments(data);
    } catch {
      // DB 초기화 전이면 빈 배열
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-muted-foreground">불러오는 중...</span>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <ClipboardList className="size-12 text-muted-foreground/50" />
        <span className="mt-4 text-lg font-semibold text-muted-foreground">
          아직 평가 기록이 없습니다
        </span>
        <span className="mt-2 text-sm text-muted-foreground">
          VD 평가를 시작하면 여기에 기록됩니다
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3 px-4 pt-4 pb-6">
      <h1 className="mb-4 text-xl font-bold text-foreground">히스토리</h1>
      {assessments.map((item) => {
        const date = new Date(item.createdAt);
        const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
        const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

        return (
          <Link
            key={item.id}
            href={`/history/${item.id}`}
            className="glass shadow-glass block rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {item.patientName ?? "환자 미등록"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {dateStr} {timeStr}
                </p>
              </div>
              <div className="text-right">
                {item.initialRatio !== null && (
                  <span
                    className={`text-lg font-bold ${
                      isNormalRange(item.initialRatio)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {item.initialRatio.toFixed(3)}
                  </span>
                )}
                <p
                  className={`text-xs font-semibold ${
                    item.initialVerdict === "NORMAL"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {item.initialVerdict ?? "-"}
                </p>
              </div>
            </div>
            {item.verifyRatio !== null && (
              <div className="mt-2 flex items-center border-t border-white/20 pt-2">
                <span className="text-xs text-muted-foreground">검증: </span>
                <span
                  className={`text-sm font-semibold ${
                    isNormalRange(item.verifyRatio)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {item.verifyRatio.toFixed(3)} ({item.verifyVerdict})
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
