"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAssessmentById,
  deleteAssessment,
  type AssessmentRecord,
} from "@/lib/db/repository";
import { VDResultCard } from "@/components/assessment/VDResultCard";
import { isNormalRange } from "@/lib/willis/assessVD";
import { shareResult } from "@/lib/share/shareResult";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    getAssessmentById(params.id)
      .then(setAssessment)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleShare = async () => {
    if (!assessment) return;
    const photoUri = assessment.verifyPhotoUri ?? assessment.initialPhotoUri;
    const ratio = assessment.verifyRatio ?? assessment.initialRatio;
    const verdict = assessment.verifyVerdict ?? assessment.initialVerdict;
    if (!photoUri || ratio === null || !verdict) return;

    setSharing(true);
    try {
      const success = await shareResult({
        imageBase64: photoUri,
        ratio,
        verdict,
        patientName: assessment.patientName,
        date: new Date(assessment.createdAt),
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

  const handleDelete = async () => {
    if (!params.id) return;
    await deleteAssessment(params.id);
    router.push("/history");
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="text-muted-foreground">불러오는 중...</span>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="text-muted-foreground">평가를 찾을 수 없습니다</span>
      </div>
    );
  }

  const date = new Date(assessment.createdAt);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-2xl overflow-auto px-6 pt-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {assessment.patientName ?? "환자 미등록"}
          </h1>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
      </div>

      {/* 초기 촬영 결과 */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-foreground">
          1단계: 초기 촬영
        </h2>
        {assessment.initialPhotoUri && (
          <img
            src={assessment.initialPhotoUri}
            alt="초기 촬영"
            className="mt-2 h-48 w-full rounded-2xl object-cover"
          />
        )}
        {assessment.initialRatio !== null && assessment.initialVerdict && (
          <div className="mt-3">
            <VDResultCard
              ratio={assessment.initialRatio}
              verdict={assessment.initialVerdict}
            />
          </div>
        )}
      </div>

      {/* 검증 촬영 결과 */}
      {assessment.verifyRatio !== null && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-foreground">
            3단계: 검증 촬영
          </h2>
          {assessment.verifyPhotoUri && (
            <img
              src={assessment.verifyPhotoUri}
              alt="검증 촬영"
              className="mt-2 h-48 w-full rounded-2xl object-cover"
            />
          )}
          {assessment.verifyVerdict && (
            <div className="mt-3">
              <VDResultCard
                ratio={assessment.verifyRatio}
                verdict={assessment.verifyVerdict}
              />
            </div>
          )}

          {/* 비율 변화 */}
          {assessment.initialRatio !== null && (
            <div className="glass shadow-glass mt-3 rounded-2xl p-4">
              <span className="text-sm font-semibold text-foreground">
                비율 변화
              </span>
              <div className="mt-2 flex items-center justify-center gap-4">
                <span
                  className={`text-xl font-bold ${
                    isNormalRange(assessment.initialRatio)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {assessment.initialRatio.toFixed(3)}
                </span>
                <ArrowRight className="size-5 text-muted-foreground/50" />
                <span
                  className={`text-xl font-bold ${
                    isNormalRange(assessment.verifyRatio)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {assessment.verifyRatio.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 메모 */}
      {assessment.notes ? (
        <div className="glass shadow-glass mt-6 rounded-2xl p-4">
          <span className="text-sm font-semibold text-foreground">메모</span>
          <p className="mt-1 text-sm text-muted-foreground">{assessment.notes}</p>
        </div>
      ) : null}

      {/* 공유 버튼 */}
      <Button
        className="mt-8 w-full rounded-2xl py-6 text-base font-bold"
        onClick={handleShare}
        disabled={sharing}
      >
        {sharing ? "공유 준비 중..." : "결과 공유"}
      </Button>

      {/* 삭제 버튼 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-3 w-full rounded-2xl border-red-200/50 bg-red-50/30 py-6 text-base font-semibold text-red-600 hover:bg-red-100/40"
          >
            기록 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 평가 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
