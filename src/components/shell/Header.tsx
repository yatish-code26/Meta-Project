import React from 'react';
import { Compass, RotateCcw, ShieldCheck, Terminal, Sparkles, ChevronDown } from 'lucide-react';
import { SyntheticPreset } from '../../types/twin';
import { ProviderTelemetry } from '../../services/recoveryApiClient';

interface HeaderProps {
  presets: { preset: SyntheticPreset }[];
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  telemetry: ProviderTelemetry;
  requestedProvider: 'groq' | 'meta' | 'muse' | 'fixture';
  isLiveApi: boolean;
  isEvaluating: boolean;
  onReset: () => void;
  isDevDrawerOpen: boolean;
  onToggleDevDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  requestedProvider,
  isLiveApi,
  isEvaluating,
  onReset,
  isDevDrawerOpen,
  onToggleDevDrawer,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Product Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-lg">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-foreground">RouteX</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Recovery Twin™
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Autonomous Travel Recovery Simulation Sandbox
              </p>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleDevDrawer}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              title="Developer Drawer"
            >
              <Terminal className="h-4 w-4" />
            </button>
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              title="Reset Simulation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center: Scenario Preset Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <select
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full appearance-none bg-background/80 border border-border/90 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-foreground hover:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              {presets.map(({ preset }) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.origin} → {preset.destination})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Right: Telemetry & Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Active Provider Pill */}
          <button
            onClick={onToggleDevDrawer}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isLiveApi
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
            }`}
            title="Click to view developer telemetry & provider options"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isEvaluating
                  ? 'bg-blue-500 animate-ping'
                  : isLiveApi
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className="capitalize">
              {requestedProvider === 'groq'
                ? isLiveApi
                  ? 'Groq Llama 3.3 (Live)'
                  : 'Calibrated Fixture'
                : requestedProvider === 'meta'
                ? 'Meta Llama (Stub)'
                : requestedProvider === 'muse'
                ? 'Muse AI (Stub)'
                : 'Offline Fixture'}
            </span>
            <Terminal className="h-3 w-3 opacity-60 ml-0.5" />
          </button>

          {/* Reset Simulation Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-background hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Twin</span>
          </button>
        </div>
      </div>
    </header>
  );
};

