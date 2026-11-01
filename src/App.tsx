import React, { useState } from 'react';
import { useRecoveryTwin } from './hooks/useRecoveryTwin';
import { Navbar, AppView } from './components/navigation/Navbar';
import { Footer } from './components/navigation/Footer';
import { HomeOverviewPage } from './pages/HomeOverviewPage';
import { TripWorkspacePage } from './pages/TripWorkspacePage';
import { DisruptionCenterPage } from './pages/DisruptionCenterPage';
import { RecoveryOptionsPage } from './pages/RecoveryOptionsPage';
import { RecoveryTwinLabPage } from './pages/RecoveryTwinLabPage';
import { ReviewRevisedPage } from './pages/ReviewRevisedPage';
import { DeveloperDiagnosticsPage } from './pages/DeveloperDiagnosticsPage';
import { SovereignApprovalDialog } from './components/modal/SovereignApprovalDialog';
import { SYNTHETIC_DISRUPTION_EVENT } from './data/syntheticDisruptionScenario';
import { RecoveryOption } from './types/travel';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('overview');

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

  const handleSelectOptionForReview = (option: RecoveryOption) => {
    setSelectedOptionForReview(option);
    setCurrentView('revised');
  };

  const handleConfirmApprovalFromDialog = (option: RecoveryOption) => {
    confirmApproval(option);
    setCurrentView('revised');
  };

  const approvedOption = approvalRecord
    ? evaluatedOptions.find((o) => o.id === approvalRecord.optionId) || null
    : null;

  const defaultCandidate = evaluatedOptions.find((o) => o.isRecommended) || evaluatedOptions[0] || null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar with Pill Nav */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={setSelectedPresetId}
        travelerName={trip.travelerName}
        travelerTier={trip.travelerTier}
        isDisrupted={disruptionCalc.isConnectionMissed}
        isApproved={!!approvalRecord}
        onResetSimulation={resetTwin}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1">
        {currentView === 'overview' && (
          <HomeOverviewPage
            onNavigate={setCurrentView}
            selectedPresetId={selectedPresetId}
            onSelectPreset={setSelectedPresetId}
            isDisrupted={disruptionCalc.isConnectionMissed}
            isApproved={!!approvalRecord}
          />
        )}

        {currentView === 'workspace' && (
          <TripWorkspacePage
            trip={trip}
            onNavigate={setCurrentView}
            isDisrupted={disruptionCalc.isConnectionMissed}
            isApproved={!!approvalRecord}
          />
        )}

        {currentView === 'disruption' && (
          <DisruptionCenterPage
            trip={trip}
            disruption={{
              ...SYNTHETIC_DISRUPTION_EVENT,
              delayMinutes: params.delayMinutes,
            }}
            onNavigate={setCurrentView}
            onLaunchRecovery={runEvaluation}
            isEvaluating={isEvaluating}
          />
        )}

        {currentView === 'options' && (
          <RecoveryOptionsPage
            trip={trip}
            options={evaluatedOptions}
            onSelectOptionForReview={handleSelectOptionForReview}
            onNavigate={setCurrentView}
            isApproved={!!approvalRecord}
            approvedOptionId={approvalRecord?.optionId}
          />
        )}

        {currentView === 'twin-lab' && (
          <RecoveryTwinLabPage
            trip={trip}
            params={params}
            onUpdateParam={updateParam}
            disruptionCalc={disruptionCalc}
            evaluatedOptions={evaluatedOptions}
            onSelectOptionForReview={handleSelectOptionForReview}
            onResetParams={resetTwin}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'revised' && (
          <ReviewRevisedPage
            trip={trip}
            approvedOption={approvedOption}
            approvalRecord={approvalRecord}
            onConfirmApproval={confirmApproval}
            onRollback={rollbackApproval}
            onResetSimulation={resetTwin}
            onNavigate={setCurrentView}
            defaultCandidate={selectedOptionForReview || defaultCandidate}
          />
        )}

        {currentView === 'developer' && (
          <DeveloperDiagnosticsPage
            telemetry={telemetry}
            requestedProvider={requestedProvider}
            onSelectProvider={setRequestedProvider}
            rawResponse={rawResponse}
            onReevaluate={runEvaluation}
            isEvaluating={isEvaluating}
            onNavigate={setCurrentView}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={setCurrentView}
        currentTripTitle={trip.title}
        isDisrupted={disruptionCalc.isConnectionMissed}
        isApproved={!!approvalRecord}
      />

      {/* Sovereign Approval Dialog Modal */}
      <SovereignApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        option={selectedOptionForReview}
        trip={trip}
        onConfirm={handleConfirmApprovalFromDialog}
      />
    </div>
  );
}

export default App;
