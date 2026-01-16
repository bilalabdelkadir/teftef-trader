"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i + 1 <= currentStep
              ? "w-8 bg-primary"
              : "w-2 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}
