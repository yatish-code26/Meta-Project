import React, { useState } from 'react';
import { Trip, RecoveryOption, ApprovalRecord } from './types/travel';
import { INITIAL_TRIP_DATA, SYNTHETIC_DISRUPTION_EVENT } from './data/syntheticDisruptionScenario';
import { metaTravelModelService } from './services/meta/MetaTravelModelService';
import { RecoveryConstraintValidator } from './services/validation/RecoveryConstraintValidator';
import { MetaRecoveryResponse } from './services/meta/IMetaTravelModelService';
import { TripHeader } from './components/recovery/TripHeader';
import { DisruptionAlertBanner } from './components/recovery/DisruptionAlertBanner';
import { RecoveryOptionsView } from './components/recovery/RecoveryOptionsView';
import { TravelerApprovalModal } from './components/recovery/TravelerApprovalModal';
import { RevisedItineraryTimeline } from './components/recovery/RevisedItineraryTimeline';
import { DeveloperTelemetryBar } from './components/recovery/DeveloperTelemetryBar';
import { Badge } from './components/ui/badge';
import { Sparkles, Shield, Compass } from 'lucide-react';

export function App() {
  const [trip, setTrip] = useState<Trip>(INITIAL_TRIP_DATA);
  const [recoveryState, setRecoveryState] = useState<'disrupted' | 'options_ready' | 'approved'>('disrupted');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelResponse, setModelResponse] = useState<MetaRecoveryResponse | null>(null);
  const [options, setOptions] = useState<RecoveryOption[]>([]);
  const [selectedOptionForApproval, setSelectedOptionForApproval] = useState<RecoveryOption | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);

  // Trigger Recovery Generation
  const handleGenerateRecovery = async () => {
    setIsGenerating(true);
    try {
      // 1. Call Meta Model Service (or isolated test fixture if awaiting credits)
      const response = await metaTravelModelService.generateRecoveryPlan({
        trip,
        disruption: SYNTHETIC_DISRUPTION_EVENT,
        constraints: trip.constraints,
        currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
        currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
      });

      setModelResponse(response);

      // 2. Pass raw model options through the INDEPENDENT DETERMINISTIC HARD-GATE VALIDATOR
      const validatedOptions = RecoveryConstraintValidator.evaluateAll(
        response.rawOptions,
        trip,
        trip.constraints
      );

      setOptions(validatedOptions);
      setRecoveryState('options_ready');
    } catch (err) {
      console.error('Failed to generate recovery options:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Approval Dialog for an option
  const handleSelectOptionForApproval = (option: RecoveryOption) => {
    setSelectedOptionForApproval(option);
    setIsApprovalModalOpen(true);
  };

  // Traveler Approves Option
  const handleConfirmApproval = (option: RecoveryOption) => {
    const record: ApprovalRecord = {
      optionId: option.id,
      optionTitle: option.title,
      approvedAt: new Date().toISOString(),
      travelerName: trip.travelerName,
      costDelta: option.outOfPocketCost,
      timeDeltaHours: option.totalDelayHours,
      acknowledgedAssumptionsCount: option.assumptions.length,
    };

    setApprovalRecord(record);
    setIsApprovalModalOpen(false);
    setRecoveryState('approved');
  };

  // Reset demo back to disruption state
  const handleResetSimulation = () => {
    setTrip(INITIAL_TRIP_DATA);
    setRecoveryState('disrupted');
    setModelResponse(null);
    setOptions([]);
    setSelectedOptionForApproval(null);
    setIsApprovalModalOpen(false);
    setApprovalRecord(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-white pb-16">
      {/* Top Navbar */}
      <header className="border-b border-border/80 bg-card/90 backdrop-blur sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center font-black text-white text-xl shadow-md">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">
                  RouteX
                </span>
                <span className="text-xs text-zinc-400 font-medium">Travel Recovery Engine</span>
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Meta Hackathon — "Build for Your World" Challenge (Startup Track)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="text-zinc-300 border-border gap-1.5 py-1">
              <Compass className="w-3.5 h-3.5 text-primary" />
              Scenario: Missed Connection Recovery
            </Badge>
            <Badge variant="synthetic" className="py-1">
              [SYNTHETIC TEST ENVIRONMENT]
            </Badge>
          </div>
        </div>
      </header>

      {/* Discreet Developer Telemetry Bar (Meta Model Status & Key Configuration) */}
      <DeveloperTelemetryBar
        modelResponse={modelResponse}
        onCredentialsUpdated={() => {
          if (recoveryState === 'options_ready') {
            handleGenerateRecovery();
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Step A & B: Trip Context, Telemetry & Structured Constraints */}
        <TripHeader trip={trip} recoveryState={recoveryState} />

        {/* Step A: Disruption Event Telemetry Banner */}
        {recoveryState !== 'approved' && (
          <DisruptionAlertBanner
            disruption={SYNTHETIC_DISRUPTION_EVENT}
            isGenerating={isGenerating}
            onGenerateRecovery={handleGenerateRecovery}
            optionsGenerated={recoveryState === 'options_ready'}
          />
        )}

        {/* Step C & D: Recovery Alternatives, Gate Validation & Trade-offs */}
        {recoveryState === 'options_ready' && (
          <RecoveryOptionsView
            options={options}
            modelResponse={modelResponse}
            onSelectOptionForApproval={handleSelectOptionForApproval}
          />
        )}

        {/* Step E: Mandatory Traveler Authorization Modal */}
        <TravelerApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          option={selectedOptionForApproval}
          trip={trip}
          onConfirmApproval={handleConfirmApproval}
        />

        {/* Step F: Synchronized Revised Itinerary & Operational Actions */}
        {recoveryState === 'approved' && selectedOptionForApproval && (
          <RevisedItineraryTimeline
            trip={trip}
            approvedOption={selectedOptionForApproval}
            approvalRecord={approvalRecord}
            onResetSimulation={handleResetSimulation}
          />
        )}
      </main>

      {/* Unobtrusive, non-fixed footer */}
      <footer className="max-w-6xl mx-auto px-4 pt-10 text-center text-xs text-muted-foreground space-y-1">
        <p className="text-zinc-400 font-medium">
          RouteX Autonomous Travel Recovery Engine • Meta AI Developer Hackathon Submission
        </p>
        <p className="text-zinc-500">
          Strict separation of concerns: Deterministic constraint validation functions independently of model inference. Zero private data or production secrets included.
        </p>
      </footer>
    </div>
  );
}

export default App;
