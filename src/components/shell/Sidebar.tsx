import React from 'react';
import {
  Plane,
  Compass,
  Calendar,
  Layers,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Clock,
  Home,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { ALL_PRESETS } from '../../data/syntheticTrips';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: 'canvas' | 'trips' | 'landing') => void;
}

export function Sidebar({ currentTab, onSelectTab }: SidebarProps) {
  const { state, dispatch } = useRouteXStore();

  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_ACTIVE_TRIP', tripId: e.target.value });
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col justify-between flex-shrink-0 z-30 select-none">
      {/* Top Branding & Trip Switcher */}
      <div className="p-4 border-b border-border">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-2.5 cursor-pointer group mb-4"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <span className="font-['Manrope'] font-bold text-lg text-foreground tracking-tight block leading-none">
              RouteX
            </span>
            <span className="text-[12px] text-muted-foreground font-medium">
              Autonomous Recovery
            </span>
          </div>
        </div>

        {/* Trip Switcher Dropdown */}
        <div className="relative">
          <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Active Trip
          </label>
          <div className="relative">
            <select
              value={state.activeTripId}
              onChange={handleTripChange}
              className="w-full appearance-none rounded-xl bg-secondary/80 border border-border px-3 py-2 text-sm font-semibold text-foreground pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              {ALL_PRESETS.map((p) => (
                <option key={p.preset.id} value={p.preset.id}>
                  {p.preset.name} ({p.preset.origin} → {p.preset.destination})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1 flex-1">
        <button
          onClick={() => onSelectTab('canvas')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            currentTab === 'canvas'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Compass className="w-4 h-4" />
          Recovery Canvas
        </button>

        <button
          onClick={() => onSelectTab('trips')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            currentTab === 'trips'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Calendar className="w-4 h-4" />
          My Trips
        </button>

        <button
          onClick={() => onSelectTab('landing')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            currentTab === 'landing'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Home className="w-4 h-4" />
          Public Landing
        </button>
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {/* Clock Mode Badge */}
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-secondary/80 text-muted-foreground border border-border">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">
              {state.clockMode === 'demo' ? 'Demo Mode (13:30 CET)' : 'Live Clock'}
            </span>
          </div>
          <button
            onClick={() =>
              dispatch({
                type: 'SET_CLOCK_MODE',
                mode: state.clockMode === 'demo' ? 'real' : 'demo',
              })
            }
            className="text-primary hover:underline font-semibold"
          >
            {state.clockMode === 'demo' ? 'Go Real' : 'Go Demo'}
          </button>
        </div>

        {/* Restart Demo Button */}
        <button
          onClick={() => dispatch({ type: 'RESET_DEMO' })}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart Demo
        </button>
      </div>
    </aside>
  );
}

