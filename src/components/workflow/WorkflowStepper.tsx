import { Check } from "lucide-react";

const STEPS = [
  { label: "초기 촬영" },
  { label: "VD Detector" },
  { label: "검증 촬영" },
  { label: "인상채득" },
];

interface WorkflowStepperProps {
  currentStep: number;
}

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/6 bg-[#16181C] px-4 py-3">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={stepNumber} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                isActive
                  ? "bg-gradient-to-br from-[#5BB7D5] to-[#3A8FBA] shadow-[0_0_12px_rgba(91,183,213,0.4)]"
                  : isCompleted
                    ? "bg-success/80"
                    : "bg-white/6 border border-white/8"
              }`}
            >
              {isCompleted ? (
                <Check className="size-4 text-white" />
              ) : (
                <span
                  className={`text-sm font-bold ${
                    isActive ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  {stepNumber}
                </span>
              )}
            </div>
            <span
              className={`mt-1 text-xs ${
                isActive
                  ? "font-semibold text-primary-600"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
