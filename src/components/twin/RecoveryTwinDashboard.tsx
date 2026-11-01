import React, { useState } from 'react';
import { useRecoveryTwin } from '../../hooks/useRecoveryTwin';
import { Header } from '../shell/Header';
import { DeveloperStatusDrawer } from '../shell/DeveloperStatusDrawer';
import { SimulationControlPanel } from './SimulationControlPanel';
import { RouteComparisonMatrix } from './RouteComparisonMatrix';
import { AssumptionsDrawer } from './AssumptionsDrawer';
import { SovereignApprovalDialog } from '../modal/SovereignApprovalDialog';
import { RevisedItineraryTimeline } from '../timeline/RevisedItineraryTimeline';
import { Sparkles, Shield, User, Award, Plane, AlertTriangle, ArrowRight } from 'lucide-react';

export const RecoveryTwinDashboard: React.FC = () => {
  const {
    presets,
    selectedPresetId,
    setSelectedPresetId,
    trip,
    params,
    updateParam,
    requestedProvider,
    setRequestedProvider,
    telemetry,
    isEvaluating,
    rawResponse,
    disruptionCalc,
    evaluatedOptions,
    selectedOptionForReview,
    setSelectedOptionForReview,
    isApprovalDialogOpen,
    setIsApprovalDialogOpen,
    approvalRecord,
    confirmApproval,
    rollbackApproval,
    resetTwin,
    runEvaluation,
  } = useRecoveryTwin();

  const [isDevDrawerOpen, setIsDevDrawerOpen] = useState(false);

  // Active recommended or first qualified option for assumptions preview
  const primaryOption = evaluatedOptions.find((o) => o.isRecommended) || evaluatedOptions[0];

  const approvedOption = approvalRecord
    ? evaluatedOptions.find((o) => o.id === approvalRecord.optionId) || primaryOption
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white pb-16">
      {/* Top Navbar */}
      <Header
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={setSelectedPresetId}
        telemetry={telemetry}
        requestedProvider={requestedProvider}
        isLiveApi={rawResponse?.executionMode === 'LIVE_API'}
        isEvaluating={isEvaluating}
        onReset={resetTwin}
        isDevDrawerOpen={isDevDrawerOpen}
        onToggleDevDrawer={() => setIsDevDrawerOpen((prev) => !prev)}
      />

      {/* Developer Telemetry Drawer */}
      <DeveloperStatusDrawer
        isOpen={isDevDrawerOpen}
        onClose={() => setIsDevDrawerOpen(false)}
        telemetry={telemetry}
        requestedProvider={requestedProvider}
        onSelectProvider={setRequestedProvider}
        rawResponse={rawResponse}
        onReevaluate={runEvaluation}
        isEvaluating={isEvaluating}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Trip Header Banner */}
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {trip.id}
                </span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {trip.travelerName}
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {trip.travelerTier}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {trip.title}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{trip.origin}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{trip.destination}</span>
                <span>• Hard Deadline: {trip.constraints.hardArrivalDeadline}</span>
              </p>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2 self-start md:self-center">
              {approvalRecord ? (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span>Itinerary Revised & Authorized</span>
                </div>
              ) : disruptionCalc.isConnectionMissed ? (
                <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Active Disruption Detected</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span>Connection Feasible</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dual-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Simulation Controls & Assumptions (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <SimulationControlPanel
              params={params}
              onUpdateParam={updateParam}
              disruptionCalc={disruptionCalc}
              origin={trip.origin}
              destination={trip.destination}
              hubLocation={trip.itinerary[1]?.departureLocation || 'Frankfurt (FRA)'}
            />

            {primaryOption && (
              <AssumptionsDrawer
                assumptions={primaryOption.assumptions}
                nextSteps={primaryOption.nextSteps}
              />
            )}
          </div>

          {/* Right Column: Comparison Matrix OR Revised Timeline (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* AI Reasoning Summary Callout */}
            {rawResponse && !approvalRecord && (
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Autonomous Route Assessment</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {rawResponse.providerId.toUpperCase()} • {rawResponse.executionMode}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {rawResponse.reasoningSummary}
                </p>
              </div>
            )}

            {/* Approved Timeline OR Candidate Matrix */}
            {approvalRecord && approvedOption ? (
              <RevisedItineraryTimeline
                trip={trip}
                approvedOption={approvedOption}
                approvalRecord={approvalRecord}
                onResetSimulation={resetTwin}
                onRollback={rollbackApproval}
              />
            ) : (
              <RouteComparisonMatrix
                options={evaluatedOptions}
                onSelectOptionForReview={(opt) => {
                  setSelectedOptionForReview(opt);
                  setIsApprovalDialogOpen(true);
                }}
                isApproved={!!approvalRecord}
                approvedOptionId={approvalRecord?.optionId}
              />
            )}
          </div>
        </div>
      </main>

      {/* Sovereign Approval Dialog Modal */}
      <SovereignApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        option={selectedOptionForReview}
        trip={trip}
        onConfirm={confirmApproval}
      />
    </div>
  );
};

