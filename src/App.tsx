import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RouteXProvider, useRouteXStore } from './context/RouteXStore';
import { Sidebar } from './components/shell/Sidebar';
import { TopBar } from './components/shell/TopBar';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { TripsPage } from './pages/TripsPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { ConfirmedPage } from './pages/ConfirmedPage';

export type ScreenRoute = 'landing' | 'canvas' | 'trips' | 'recovery' | 'confirmed';

function hashToRoute(hash: string): ScreenRoute {
  switch (hash) {
    case '#landing':
      return 'landing';
    case '#trips':
      return 'trips';
    case '#recovery':
      return 'recovery';
    case '#confirmed':
      return 'confirmed';
    case '#trip':
    case '#canvas':
    default:
      return 'canvas';
  }
}

function MainAppShell() {
  const [route, setRoute] = useState<ScreenRoute>(() => hashToRoute(window.location.hash));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const {
    state,
    dispatch,
    currentConfig,
    disruptionCalc,
    evaluatedOptions,
  } = useRouteXStore();

  useEffect(() => {
    const onHashChange = () => {
      setRoute(hashToRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-teal-500 selection:text-white">
      {/* Desktop / Tablet Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          currentTab={route === 'canvas' ? 'canvas' : route === 'trips' ? 'trips' : 'landing'}
          onSelectTab={(tab) => navigate(tab as ScreenRoute)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
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
                currentTab={route === 'canvas' ? 'canvas' : route === 'trips' ? 'trips' : 'landing'}
                onSelectTab={(tab) => navigate(tab as ScreenRoute)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* OrbitTrip Top Bar with Live Countdown Chips */}
        <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

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
              {route === 'canvas' && <WorkspacePage />}

              {route === 'trips' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                  <TripsPage
                    onNavigate={(s) => navigate(s === 'trip' ? 'canvas' : (s as ScreenRoute))}
                    isDisrupted={disruptionCalc.isConnectionMissed}
                    isApproved={isApproved}
                  />
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
