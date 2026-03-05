"use client";

import { WorkflowStepper } from "@/components/workflow/WorkflowStepper";
import { StepInitialPhoto } from "@/components/workflow/StepInitialPhoto";
import { StepVDDetector } from "@/components/workflow/StepVDDetector";
import { StepVerifyPhoto } from "@/components/workflow/StepVerifyPhoto";
import { StepImpression } from "@/components/workflow/StepImpression";
import { useAssessmentStore } from "@/lib/store/assessmentStore";

export default function AssessPage() {
  const { currentStep } = useAssessmentStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepInitialPhoto />;
      case 2:
        return <StepVDDetector />;
      case 3:
        return <StepVerifyPhoto />;
      case 4:
        return <StepImpression />;
      default:
        return <StepInitialPhoto />;
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <WorkflowStepper currentStep={currentStep} />
      {renderStep()}
    </div>
  );
}
