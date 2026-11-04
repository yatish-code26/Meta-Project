import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Layers,
  ChevronUp,
  ChevronDown,
  Compass,
  SlidersHorizontal,
  ListOrdered,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { RouteMap } from '../components/map/RouteMap';
import { FloatingPanel } from '../components/shell/FloatingPanel';
import { StepProgress } from '../components/twin/StepProgress';
import { useRouteXStore } from '../context/RouteXStore';

export function WorkspacePage() {
  const { state, dispatch } = useRouteXStore();
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState<boolean>(false);

  const isApproved = !!state.approvalRecord;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden flex flex-col md:flex-row bg-[#F2F5F8]">
      {/* Background Map Canvas (World Atlas Coastlines + Great Circle Arcs) */}
      <div className="absolute inset-0 z-0">
        <RouteMap
          isDisrupted={true}
          isApproved={isApproved}
          width={1400}
          height={800}
        />
      </div>

      {/* Desktop / Tablet: Floating Left Panel (OrbitTrip Style) */}
      <div className="hidden md:block absolute top-4 left-4 bottom-4 w-[460px] xl:w-[500px] z-10 pointer-events-auto">
        <FloatingPanel />
      </div>

      {/* Desktop / Tablet: Bottom Journey Ribbon (Reference 3 inspired) */}
      <div className="hidden md:block absolute bottom-4 left-[490px] xl:left-[530px] right-6 z-10 pointer-events-auto">
        <StepProgress variant="ribbon" />
      </div>

      {/* Mobile: Bottom Sheet (Berlin Transit Style with safe-area padding) */}
      <div className="md:hidden absolute inset-x-0 bottom-0 z-20 pointer-events-auto flex flex-col">
        {/* Drag handle & header to toggle height */}
        <div
          onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
          className="bg-card border-t border-border rounded-t-3xl pt-2 pb-3 px-4 shadow-2xl flex flex-col items-center cursor-pointer select-none"
        >
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-2" />
          <div className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="text-foreground font-bold">
              {state.activePanelTab === 'options'
                ? 'Recovery Paths'
                : state.activePanelTab === 'twin'
                ? 'Twin Lab'
                : state.activePanelTab === 'itinerary'
                ? 'Itinerary'
                : state.activePanelTab === 'expenses'
                ? 'Expenses'
                : 'Assistant'}
            </span>
            <div className="flex items-center gap-1 text-primary">
              <span>{isMobileSheetExpanded ? 'Collapse' : 'Expand'}</span>
              {isMobileSheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Sheet Content Container */}
        <div
          className={`bg-card overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileSheetExpanded ? 'h-[75vh]' : 'h-[38vh]'
          }`}
        >
          <FloatingPanel />
        </div>

        {/* Mobile Bottom Tab Bar (Safe-area padded, never covers content) */}
        <nav className="bg-card/95 backdrop-blur border-t border-border px-2 py-2 pb-safe flex items-center justify-around z-30">
          {[
            { id: 'options', label: 'Paths', icon: Compass },
            { id: 'twin', label: 'Twin Lab', icon: SlidersHorizontal },
            { id: 'itinerary', label: 'Schedule', icon: ListOrdered },
            { id: 'expenses', label: 'Expenses', icon: Receipt },
            { id: 'assistant', label: 'AI Help', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = state.activePanelTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  dispatch({ type: 'SET_PANEL_TAB', tab: tab.id as any });
                  setIsMobileSheetExpanded(true);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[12px] font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
