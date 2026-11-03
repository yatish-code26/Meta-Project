import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRecoveryTwin } from './hooks/useRecoveryTwin';
import { AppHeader, Screen } from './components/navigation/AppHeader';
import { TripsPage } from './pages/TripsPage';
import { TripPage } from './pages/TripPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { ConfirmedPage } from './pages/ConfirmedPage';
import { RecoveryOption } from './types/travel';
import { getPresetById } from './data/syntheticTrips';

// Read screen from URL hash
function hashToScreen(hash: string): Screen {
  const map: Record<string, Screen> = {
    '#trips': 'trips',
    '#trip': 'trip',
    '#recovery': 'recovery',
    '#confirmed': 'confirmed',
  };
  return map[hash] ?? 'trips';
}

export function App() {
  const [screen, setScreen] = useState<Screen>(() => hashToScreen(window.location.hash));
  const shouldReduceMotion = useReducedMotion();

  // Sync hash → state when user navigates browser history
  useEffect(() => {
    const handler = () => setScreen(hashToScreen(window.location.hash));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Sync state → hash
  const navigate = (s: Screen) => {
    window.location.hash = s;
    setScreen(s);
  };

  const {
    trip,
    params,
    updateParam,
    disruptionCalc,
    evaluatedOptions,
    selectedOptionForReview,
    setSelectedOptionForReview,
    approvalRecord,
    confirmApproval,
    rollbackApproval,
    resetTwin,
    rawResponse,
  } = useRecoveryTwin();

  const isDisrupted = disruptionCalc.isConnectionMissed;
  const isApproved = !!approvalRecord;

  const approvedOption = approvalRecord
    ? evaluatedOptions.find((o) => o.id === approvalRecord.optionId) ?? null
    : null;

  // Derive current display option for ConfirmedPage
  const displayOption =
    selectedOptionForReview ??
    evaluatedOptions.find((o) => o.isRecommended) ??
    evaluatedOptions[0] ??
    null;

  // Provider mode label for Recovery page
  const providerMode = (() => {
    if (rawResponse?.modelMetadata?.isLiveApiCall) return 'Live AI';
    return 'Offline simulation';
  })();

  const currentConfig = getPresetById('tokyo-symposium');

  const handleSelectOption = (option: RecoveryOption) => {
    setSelectedOptionForReview(option);
    navigate('confirmed');
  };

  const handleRestart = () => {
    rollbackApproval();
    resetTwin();
    navigate('trips');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <AppHeader
        screen={screen}
        onNavigate={navigate}
        onRestart={handleRestart}
        isDisrupted={isDisrupted}
      />

      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          >
            {screen === 'trips' && (
              <TripsPage
                onNavigate={navigate}
                isDisrupted={isDisrupted}
                isApproved={isApproved}
              />
            )}

            {screen === 'trip' && (
              <TripPage
                trip={trip}
                delayMinutes={params.delayMinutes}
                isDisrupted={isDisrupted}
                isApproved={isApproved}
                onNavigate={navigate}
              />
            )}

            {screen === 'recovery' && (
              <RecoveryPage
                options={evaluatedOptions}
                disruptionCalc={disruptionCalc}
                params={params}
                onUpdateParam={updateParam}
                onSelectOption={handleSelectOption}
                onNavigate={navigate}
                currentConfig={currentConfig}
                providerMode={providerMode}
              />
            )}

            {screen === 'confirmed' && (
              <ConfirmedPage
                option={displayOption}
                approvalRecord={approvedOption ? approvalRecord : null}
                onConfirm={confirmApproval}
                onRollback={() => {
                  rollbackApproval();
                  navigate('recovery');
                }}
                onNavigate={navigate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Minimal clean footer */}
      <footer className="border-t border-border py-4 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>RouteX — Autonomous Disruption Recovery · Offline simulation prototype</span>
          <button
            onClick={handleRestart}
            className="hover:text-foreground font-medium underline-offset-4 hover:underline transition-colors"
          >
            Restart demo
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
