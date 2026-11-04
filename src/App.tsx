import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plane, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { RouteXProvider, useRouteXStore } from './context/RouteXStore';
import { Sidebar } from './components/shell/Sidebar';
import { TopBar } from './components/shell/TopBar';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { TripsPage } from './pages/TripsPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { ConfirmedPage } from './pages/ConfirmedPage';
import { TeamQuorumView } from './components/team/TeamQuorumView';
import { RecoveryCertificateView } from './components/certificate/RecoveryCertificateView';
import { TripBuilderModal } from './components/builder/TripBuilderModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { GuidedTourModal } from './components/help/GuidedTourModal';
import { CommandPalette } from './components/command/CommandPalette';
import { ToastContainer, ToastMessage } from './components/ui/ToastContainer';
import { DemoCaptionsOverlay } from './components/demo/DemoCaptionsOverlay';

export type ScreenRoute =
  | 'landing'
  | 'canvas'
  | 'trips'
  | 'recovery'
  | 'confirmed'
  | 'team'
  | 'certificates'
  | 'title-card'
  | 'end-card';

function hashToRoute(rawHash: string): ScreenRoute {
  const hash = (rawHash || '').split('?')[0];
  switch (hash) {
    case '#landing':
      return 'landing';
    case '#trips':
      return 'trips';
    case '#recovery':
      return 'recovery';
    case '#confirmed':
      return 'confirmed';
    case '#team':
      return 'team';
    case '#certificates':
      return 'certificates';
    case '#title-card':
      return 'title-card';
    case '#end-card':
      return 'end-card';
    case '#trip':
    case '#canvas':
    default:
      return 'canvas';
  }
}

function MainAppShell() {
  const [route, setRoute] = useState<ScreenRoute>(() => hashToRoute(window.location.hash));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTripBuilderOpen, setIsTripBuilderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isRecordMode =
    typeof window !== 'undefined' &&
    (window.location.search.includes('record=1') || window.location.hash.includes('record=1'));
  const shouldReduceMotion = useReducedMotion();

  const {
    state,
    dispatch,
    currentConfig,
    disruptionCalc,
    evaluatedOptions,
  } = useRouteXStore();

  const addToast = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' = 'info',
    onUndo?: () => void
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type, onUndo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const onHashChange = () => {
      setRoute(hashToRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (newRoute: ScreenRoute) => {
    window.location.hash = newRoute === 'canvas' ? '#trip' : `#${newRoute}`;
    setRoute(newRoute);
    setIsSidebarOpen(false);
  };

  if (route === 'landing') {
    return <LandingPage onEnterApp={() => navigate('canvas')} />;
  }

  const isApproved = !!state.approvalRecord;
  const approvedOption = state.approvalRecord
    ? evaluatedOptions.find((o) => o.id === state.approvalRecord?.optionId) ?? null
    : null;

  const displayOption =
    state.selectedOptionForReview ??
    evaluatedOptions.find((o) => o.isRecommended) ??
    evaluatedOptions[0] ??
    null;

  return (
    <div
      className={`flex ${
        isRecordMode ? 'h-[calc(100vh-110px)]' : 'h-screen'
      } w-screen overflow-hidden bg-background text-foreground selection:bg-teal-500 selection:text-white relative`}
    >
      {/* Desktop / Tablet Sidebar (hidden on title/end card) */}
      {route !== 'title-card' && route !== 'end-card' && (
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar
            currentTab={route}
            onSelectTab={(tab) => navigate(tab as ScreenRoute)}
            onOpenNewTrip={() => setIsTripBuilderOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenNotifications={() => {
              const unread = state.notifications.filter((n) => !n.read).length;
              addToast(
                'Activity & Disruption Feed',
                `${unread} unread events across ${state.trip.itinerary.length}-leg itinerary.`,
                'info'
              );
            }}
          />
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && route !== 'title-card' && route !== 'end-card' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-72 z-50 shadow-2xl"
            >
              <Sidebar
                currentTab={route}
                onSelectTab={(tab) => navigate(tab as ScreenRoute)}
                onOpenNewTrip={() => {
                  setIsSidebarOpen(false);
                  setIsTripBuilderOpen(true);
                }}
                onOpenSettings={() => {
                  setIsSidebarOpen(false);
                  setIsSettingsOpen(true);
                }}
                onOpenHelp={() => {
                  setIsSidebarOpen(false);
                  setIsHelpOpen(true);
                }}
                onOpenNotifications={() => {
                  setIsSidebarOpen(false);
                  addToast('Notifications', `${state.notifications.length} alerts loaded.`, 'info');
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* OrbitTrip Top Bar with Live Countdown Chips (hidden on title/end card) */}
        {route !== 'title-card' && route !== 'end-card' && (
          <TopBar
            currentRoute={route}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        {/* Content Body */}
        <main className="flex-1 relative overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="h-full w-full"
            >
              {/* Title Card Shot (0 - 6s) */}
              {route === 'title-card' && (
                <div
                  data-testid="title-card"
                  className="h-full w-full flex flex-col items-center justify-center bg-card p-12 text-center select-none"
                >
                  <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                    <Plane className="w-12 h-12" />
                  </div>
                  <h1 className="font-['Manrope'] font-extrabold text-6xl text-foreground tracking-tight mb-4">
                    RouteX
                  </h1>
                  <p className="text-2xl font-bold text-foreground/90 max-w-2xl leading-relaxed mb-4">
                    Recover from missed connections.
                  </p>
                  <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>AI proposes, code verifies. All trip data is synthetic.</span>
                  </div>
                </div>
              )}

              {/* End Card Shot (114 - 120s) */}
              {route === 'end-card' && (
                <div
                  data-testid="end-card"
                  className="h-full w-full flex flex-col items-center justify-center bg-card p-12 text-center select-none"
                >
                  <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
                    <Shield className="w-12 h-12" />
                  </div>
                  <h1 className="font-['Manrope'] font-extrabold text-6xl text-foreground tracking-tight mb-4">
                    RouteX
                  </h1>
                  <p className="text-2xl font-bold text-foreground/90 max-w-2xl leading-relaxed mb-4">
                    Autonomous Disruption Recovery Architecture
                  </p>
                  <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-secondary text-muted-foreground border border-border text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Synthetic data. Simulation only. No bookings are made.</span>
                  </div>
                </div>
              )}

              {route === 'canvas' && <WorkspacePage />}

              {route === 'trips' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                  <TripsPage
                    onNavigate={(s) => navigate(s === 'trip' ? 'canvas' : (s as ScreenRoute))}
                    onOpenNewTrip={() => setIsTripBuilderOpen(true)}
                    isDisrupted={disruptionCalc.isConnectionMissed}
                    isApproved={isApproved}
                  />
                </div>
              )}

              {route === 'team' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                  <TeamQuorumView />
                </div>
              )}

              {route === 'certificates' && (
                <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                  <RecoveryCertificateView />
                </div>
              )}

              {route === 'recovery' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                  <RecoveryPage
                    options={evaluatedOptions}
                    disruptionCalc={disruptionCalc}
                    params={state.params}
                    onUpdateParam={(key, val) => dispatch({ type: 'UPDATE_PARAM', key, value: val })}
                    onSelectOption={(opt) => {
                      dispatch({ type: 'SELECT_OPTION_FOR_REVIEW', option: opt });
                      navigate('confirmed');
                    }}
                    onNavigate={(s) => navigate(s === 'trip' ? 'canvas' : (s as ScreenRoute))}
                    currentConfig={currentConfig}
                    providerMode="Offline simulation"
                  />
                </div>
              )}

              {route === 'confirmed' && (
                <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                  <ConfirmedPage
                    option={displayOption}
                    approvalRecord={approvedOption ? state.approvalRecord : null}
                    onConfirm={(opt) => dispatch({ type: 'CONFIRM_APPROVAL', option: opt })}
                    onRollback={() => {
                      dispatch({ type: 'ROLLBACK_APPROVAL' });
                      navigate('canvas');
                    }}
                    onNavigate={(s) => navigate(s === 'trip' ? 'canvas' : (s as ScreenRoute))}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals & Controls */}
      <TripBuilderModal
        isOpen={isTripBuilderOpen}
        onClose={() => setIsTripBuilderOpen(false)}
        onSaveTrip={(userTrip) => {
          dispatch({ type: 'SET_USER_TRIP', userTrip });
          setIsTripBuilderOpen(false);
          addToast(
            'Custom Trip Configured',
            `${userTrip.legs.length} legs loaded. Deterministic engine re-evaluated.`,
            'success'
          );
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <GuidedTourModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(target) => navigate(target as ScreenRoute)}
        onOpenTripBuilder={() => setIsTripBuilderOpen(true)}
        onOpenAddOption={() => {
          navigate('canvas');
          dispatch({ type: 'SET_PANEL_TAB', tab: 'options' });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Floating Action Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* 110px Subtitle & Caption Strip (shown only when ?record=1) */}
      <DemoCaptionsOverlay isRecordMode={isRecordMode} />
    </div>
  );
}

export function App() {
  return (
    <RouteXProvider>
      <MainAppShell />
    </RouteXProvider>
  );
}

export default App;
