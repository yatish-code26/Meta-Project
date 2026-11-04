import React from 'react';
import {
  Plane,
  Compass,
  Calendar,
  SlidersHorizontal,
  Users,
  ListOrdered,
  Receipt,
  FileCheck2,
  Sparkles,
  Bell,
  Settings,
  HelpCircle,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { ALL_PRESETS } from '../../data/syntheticTrips';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewTrip: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenNotifications: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  onOpenNewTrip,
  onOpenSettings,
  onOpenHelp,
  onOpenNotifications,
}: SidebarProps) {
  const { state, dispatch } = useRouteXStore();

  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_ACTIVE_TRIP', tripId: e.target.value });
  };

  const unreadNotifsCount = state.notifications.filter((n) => !n.read).length;

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col justify-between flex-shrink-0 z-30 select-none h-full">
      {/* Top Branding & Example Selector */}
      <div className="p-4 border-b border-border">
        {/* Logo -> goes to landing page */}
        <button
          type="button"
          onClick={() => onSelectTab('landing')}
          className="w-full flex items-center gap-2.5 cursor-pointer group mb-4 text-left"
          title="Return to Public Landing Page"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <span className="font-['Manrope'] font-bold text-lg text-foreground tracking-tight block leading-none">
              RouteX
            </span>
            <span className="text-[12px] text-muted-foreground font-medium">
              Disruption Recovery
            </span>
          </div>
        </button>

        {/* Example Switcher */}
        <div className="relative">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Load Example Scenario
          </label>
          <div className="relative">
            <select
              value={state.activeTripId}
              onChange={handleTripChange}
              className="w-full appearance-none rounded-xl bg-secondary/80 border border-border px-3 py-1.5 text-xs font-semibold text-foreground pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              {ALL_PRESETS.map((p) => (
                <option key={p.preset.id} value={p.preset.id}>
                  [Example] {p.preset.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Navigation (12 working items) */}
      <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
        {/* 1. Trips */}
        <button
          type="button"
          data-testid="sidebar-trips"
          onClick={() => onSelectTab('trips')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'trips'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Trips</span>
        </button>

        {/* 2. New Trip Button */}
        <button
          type="button"
          data-testid="sidebar-new-trip"
          onClick={onOpenNewTrip}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Plus className="w-4 h-4" />
            <span>New Trip</span>
          </div>
          <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono">
            Wizard
          </span>
        </button>

        {/* 3. Recovery Canvas */}
        <button
          type="button"
          data-testid="sidebar-recovery"
          onClick={() => {
            onSelectTab('canvas');
            dispatch({ type: 'SET_PANEL_TAB', tab: 'options' });
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'canvas' && state.activePanelTab === 'options'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Recovery</span>
        </button>

        {/* 4. Digital Twin */}
        <button
          type="button"
          data-testid="sidebar-twin"
          onClick={() => {
            onSelectTab('canvas');
            dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' });
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'canvas' && state.activePanelTab === 'twin'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Digital Twin</span>
        </button>

        {/* 5. Team Quorum */}
        <button
          type="button"
          data-testid="sidebar-team"
          onClick={() => onSelectTab('team')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'team'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Quorum</span>
        </button>

        {/* 6. Itinerary */}
        <button
          type="button"
          data-testid="sidebar-itinerary"
          onClick={() => {
            onSelectTab('canvas');
            dispatch({ type: 'SET_PANEL_TAB', tab: 'itinerary' });
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'canvas' && state.activePanelTab === 'itinerary'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Itinerary</span>
        </button>

        {/* 7. Expenses */}
        <button
          type="button"
          data-testid="sidebar-expenses"
          onClick={() => {
            onSelectTab('canvas');
            dispatch({ type: 'SET_PANEL_TAB', tab: 'expenses' });
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'canvas' && state.activePanelTab === 'expenses'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses</span>
        </button>

        {/* 8. Evidence Certificates */}
        <button
          type="button"
          data-testid="sidebar-certificates"
          onClick={() => onSelectTab('certificates')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'certificates'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Evidence Ledger</span>
        </button>

        {/* 9. Assistant */}
        <button
          type="button"
          data-testid="sidebar-assistant"
          onClick={() => {
            onSelectTab('canvas');
            dispatch({ type: 'SET_PANEL_TAB', tab: 'assistant' });
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            currentTab === 'canvas' && state.activePanelTab === 'assistant'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Assistant</span>
        </button>

        {/* 10. Notifications */}
        <button
          type="button"
          data-testid="sidebar-notifications"
          onClick={onOpenNotifications}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </div>
          {unreadNotifsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </nav>

      {/* 11 & 12 Bottom System Actions: Settings & Help */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          type="button"
          data-testid="sidebar-settings"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Settings className="w-4 h-4 text-primary" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          data-testid="sidebar-help"
          onClick={onOpenHelp}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>Help & Tour</span>
        </button>
      </div>
    </aside>
  );
}
