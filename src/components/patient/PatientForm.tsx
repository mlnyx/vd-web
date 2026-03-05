"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const patientSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  age: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  chartNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  onSkip?: () => void;
}

export function PatientForm({ onSubmit, onSkip }: PatientFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: "", age: "", chartNumber: "", notes: "" },
  });

  return (
    <div className="space-y-4">
      {/* 이름 */}
      <div>
        <Label className="mb-1 text-sm font-semibold text-foreground">
          환자 이름 *
        </Label>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input placeholder="환자 이름" {...field} />
          )}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
        )}
      </div>

      {/* 나이 + 성별 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className="mb-1 text-sm font-semibold text-foreground">
            나이
          </Label>
          <Controller
            control={control}
            name="age"
            render={({ field }) => (
              <Input type="number" placeholder="나이" {...field} />
            )}
          />
        </div>
        <div className="flex-1">
          <Label className="mb-1 text-sm font-semibold text-foreground">
            성별
          </Label>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-xl border py-2.5 text-center text-sm font-semibold transition-all ${
                    value === "M"
                      ? "glass bg-primary-100/50 shadow-glass border-primary-400 text-primary-600"
                      : "border-border text-muted-foreground hover:glass-subtle"
                  }`}
                  onClick={() => onChange("M")}
                >
                  남
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border py-2.5 text-center text-sm font-semibold transition-all ${
                    value === "F"
                      ? "glass bg-primary-100/50 shadow-glass border-primary-400 text-primary-600"
                      : "border-border text-muted-foreground hover:glass-subtle"
                  }`}
                  onClick={() => onChange("F")}
                >
                  여
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {/* 차트 번호 */}
      <div>
        <Label className="mb-1 text-sm font-semibold text-foreground">
          차트 번호
        </Label>
        <Controller
          control={control}
          name="chartNumber"
          render={({ field }) => (
            <Input placeholder="차트 번호 (선택)" {...field} />
          )}
        />
      </div>

      {/* 버튼 */}
      <div className="mt-2 space-y-2">
        <Button
          className="w-full rounded-2xl py-4 text-base font-bold"
          onClick={handleSubmit(onSubmit)}
        >
          환자 등록
        </Button>
        {onSkip && (
          <button
            type="button"
            className="w-full py-3 text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={onSkip}
          >
            환자 정보 없이 진행
          </button>
        )}
      </div>
    </div>
  );
}
