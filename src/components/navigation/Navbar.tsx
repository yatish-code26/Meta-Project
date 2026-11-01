import React from 'react';
import { Compass, Plane, AlertTriangle, ShieldCheck, Sliders, CalendarCheck, RotateCcw, ChevronDown, User, Sparkles, Terminal } from 'lucide-react';
import { SyntheticPreset } from '../../types/twin';

export type AppView = 'overview' | 'workspace' | 'disruption' | 'options' | 'twin-lab' | 'revised' | 'developer';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  presets: { preset: SyntheticPreset }[];
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  travelerName: string;
  travelerTier: string;
  isDisrupted: boolean;
  isApproved: boolean;
  onResetSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  presets,
  selectedPresetId,
  onSelectPreset,
  travelerName,
  travelerTier,
  isDisrupted,
  isApproved,
  onResetSimulation,
}) => {
  const navItems: { id: AppView; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'workspace',
      label: 'Trip Workspace',
      icon: <Plane className="w-4 h-4" />,
    },
    {
      id: 'disruption',
      label: 'Disruption Center',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      badge: isDisrupted && !isApproved ? (
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Active Disruption" />
      ) : undefined,
    },
    {
      id: 'options',
      label: 'Recovery Options',
      icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'twin-lab',
      label: 'Recovery Twin™ Lab',
      icon: <Sliders className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'revised',
      label: 'Revised Itinerary',
      icon: <CalendarCheck className="w-4 h-4 text-emerald-500" />,
      badge: isApproved ? (
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Itinerary Reconciled" />
      ) : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      {/* Top Bar: Brand, Traveler & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('overview')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-foreground">RouteX</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Travel Recovery
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Autonomous Disruption Recovery & Itinerary Reconciliation
                </p>
              </div>
            </button>
          </div>

          {/* Center: Scenario Preset Switcher */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="appearance-none bg-secondary/80 border border-border/80 rounded-full px-4 py-1.5 pr-8 text-xs font-medium text-foreground hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer shadow-sm"
              >
                {presets.map(({ preset }) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.origin} → {preset.destination})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Right: Traveler Profile & Demo Reset */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                {travelerName.charAt(0)}
              </div>
              <span className="font-medium text-foreground">{travelerName}</span>
              <span className="text-[11px] text-muted-foreground">({travelerTier})</span>
            </div>

            <button
              onClick={onResetSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-all shadow-sm"
              title="Reset simulation back to default disruption state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            <button
              onClick={() => onNavigate('developer')}
              className={`p-2 rounded-full border transition-all ${
                currentView === 'developer'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                  : 'border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              title="Developer Diagnostics"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Navigation Pills (Inspired by Wandrly & Triprise) */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto py-2.5 gap-1.5 no-scrollbar border-t border-border/50">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                  isActive
                    ? 'bg-foreground text-background shadow-md'
                    : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

