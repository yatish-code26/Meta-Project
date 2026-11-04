import React from 'react';
import { AlertTriangle, Compass, FileCheck, CheckCircle2 } from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { RecoveryLifecycleStep } from '../../types/twin';

interface StepItem {
  id: RecoveryLifecycleStep;
  number: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: (state: any, calc: any, optionsCount: number) => string;
}

const STEPS: StepItem[] = [
  {
    id: 'disruption',
    number: 1,
    label: 'Disruption Detected',
    shortLabel: 'Disruption',
    icon: AlertTriangle,
    description: (_s, calc) =>
      calc.isConnectionMissed
        ? `Inbound delay +${_s.params.delayMinutes}m`
        : 'On schedule',
  },
  {
    id: 'options',
    number: 2,
    label: 'Options Evaluated',
    shortLabel: 'Options',
    icon: Compass,
    description: (_s, _c, count) =>
      count > 0 ? `${count} paths evaluated` : 'Intact connection',
  },
  {
    id: 'review',
    number: 3,
    label: 'Review & Confirm',
    shortLabel: 'Review',
    icon: FileCheck,
    description: (s) =>
      s.selectedOptionForReview
        ? s.selectedOptionForReview.carrierSummary
        : 'Select candidate',
  },
  {
    id: 'confirmed',
    number: 4,
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    icon: CheckCircle2,
    description: (s) =>
      s.approvalRecord ? 'Recovery confirmed' : 'Awaiting approval',
  },
];

const STEP_ORDER: Record<RecoveryLifecycleStep, number> = {
  disruption: 1,
  options: 2,
  review: 3,
  confirmed: 4,
};

interface StepProgressProps {
  variant?: 'inline' | 'ribbon';
  className?: string;
}

export function StepProgress({ variant = 'inline', className = '' }: StepProgressProps) {
  const { state, dispatch, disruptionCalc, evaluatedOptions, currentStep } = useRouteXStore();
  const currentStepNumber = STEP_ORDER[currentStep];

  const handleStepClick = (stepId: RecoveryLifecycleStep) => {
    if (stepId === 'disruption') {
      dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' });
    } else if (stepId === 'options') {
      dispatch({ type: 'SELECT_OPTION_FOR_REVIEW', option: null });
      dispatch({ type: 'SET_PANEL_TAB', tab: 'options' });
    } else if (stepId === 'review') {
      if (state.selectedOptionForReview) {
        dispatch({ type: 'SET_PANEL_TAB', tab: 'options' });
      } else if (evaluatedOptions.length > 0) {
        const top = evaluatedOptions.find((o) => o.hardGatePassed) || evaluatedOptions[0];
        dispatch({ type: 'SELECT_OPTION_FOR_REVIEW', option: top });
        dispatch({ type: 'SET_PANEL_TAB', tab: 'options' });
      }
    } else if (stepId === 'confirmed') {
      if (state.approvalRecord) {
        window.location.hash = '#confirmed';
      }
    }
  };

  if (variant === 'ribbon') {
    // Reference 3 style: Bottom journey ribbon across the canvas
    return (
      <div
        className={`bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl px-4 py-2.5 flex items-center justify-between gap-2 max-w-4xl mx-auto ${className}`}
      >
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = currentStepNumber > step.number;
          const isCurrent = currentStepNumber === step.number;
          const isUpcoming = currentStepNumber < step.number;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all text-left group ${
                  isCurrent
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : isPassed
                    ? 'text-foreground hover:bg-muted/50'
                    : 'text-muted-foreground opacity-75 hover:opacity-100 hover:bg-muted/30'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    {step.label}
                  </span>
                  <span className="text-[12px] text-muted-foreground leading-tight hidden lg:block">
                    {step.description(state, disruptionCalc, evaluatedOptions.length)}
                  </span>
                </div>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 sm:w-10 rounded-full transition-all ${
                    currentStepNumber > idx + 1 ? 'bg-emerald-500' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Inline variant for FloatingPanel
  return (
    <div className={`bg-secondary/40 border border-border rounded-xl p-3 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((step, idx) => {
          const isPassed = currentStepNumber > step.number;
          const isCurrent = currentStepNumber === step.number;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`flex-1 flex flex-col items-center p-1.5 rounded-lg transition-all text-center ${
                  isCurrent
                    ? 'bg-card text-foreground shadow-sm border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold mb-1 transition-all ${
                    isCurrent
                      ? 'bg-primary text-white'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.number}
                </div>
                <span className="text-[12px] font-semibold truncate max-w-full leading-tight">
                  {step.shortLabel}
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-3 sm:w-4 flex-shrink-0 rounded-full ${
                    currentStepNumber > idx + 1 ? 'bg-emerald-500' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

