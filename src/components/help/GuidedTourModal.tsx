import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Compass, Sliders, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    title: 'Top Bar & Gate Closure Horizon',
    subtitle: 'Real-time Telemetry Strip',
    description:
      'The top header displays the live countdown to the gate closure and flight reservation cutoff. It updates dynamically from the time service so you never miss a commitment window.',
    icon: Compass,
    elementTarget: 'TopBar Chips',
  },
  {
    title: 'Digital Twin & Delay Propagation',
    subtitle: 'Topology Simulation',
    description:
      'In the Digital Twin tab, the directed graph traces how upstream delays cascade through hub connection buffers down to destination hotel check-in and partner keynotes.',
    icon: Sliders,
    elementTarget: 'TwinLab Graph',
  },
  {
    title: 'Deterministic Gate Verification',
    subtitle: 'AI Proposes · Code Verifies',
    description:
      'Candidate options are checked against 4 deterministic physical gates: Hub MCT feasibility, arrival deadline, budget ceiling, and Schengen visa rules. Infeasible options are disqualified.',
    icon: ShieldCheck,
    elementTarget: 'Paths Tab',
  },
  {
    title: 'Input-Driven Trip Builder',
    subtitle: 'Custom Itinerary Configuration',
    description:
      'Click "Configure Trip" in the Paths panel to enter any real flight legs using bundled IATA airport autocomplete and true IANA time zone instants. No hard-coded assumptions.',
    icon: MapPin,
    elementTarget: 'TripBuilder Trigger',
  },
  {
    title: 'Command Palette & Keyboard Control',
    subtitle: 'Fast Accessibility',
    description:
      'Press Cmd+K (or Ctrl+K) anywhere in RouteX to open the command palette. Jump between views, run simulations, export iCalendar files, or inspect certificates instantly.',
    icon: Sparkles,
    elementTarget: 'Cmd+K Palette',
  },
];

export function GuidedTourModal({ isOpen, onClose }: GuidedTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Indicator */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{step.elementTarget}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close tour"
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
            <Icon className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-['Manrope'] font-bold text-base text-foreground">
              {step.title}
            </h3>
            <span className="text-xs text-primary font-semibold block">{step.subtitle}</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-5 bg-primary' : 'bg-secondary hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/20">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 flex items-center gap-1 shadow-sm"
          >
            <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
            {currentStep === TOUR_STEPS.length - 1 ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

