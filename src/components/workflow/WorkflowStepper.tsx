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
    <div className="glass-heavy flex items-center justify-between px-4 py-3">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={stepNumber} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                isActive
                  ? "bg-gradient-to-br from-primary-600 to-primary-500 shadow-glass"
                  : isCompleted
                    ? "bg-success/80"
                    : "glass-subtle"
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
