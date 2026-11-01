import React from 'react';
import { ShieldCheck, Terminal, Compass, ArrowRight } from 'lucide-react';
import { AppView } from './Navbar';

interface FooterProps {
  onNavigate: (view: AppView) => void;
  currentTripTitle: string;
  isDisrupted: boolean;
  isApproved: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  currentTripTitle,
  isDisrupted,
  isApproved,
}) => {
  return (
    <footer className="border-t border-border bg-card/60 mt-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        {/* Left: Brand & Trip Status */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground tracking-tight">RouteX</span>
            <span className="text-[11px] text-muted-foreground">• Travel Recovery Platform</span>
          </div>
          <span className="hidden sm:inline text-border">|</span>
          <span className="text-[11px] font-medium text-foreground truncate max-w-xs">
            Active: {currentTripTitle}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : isDisrupted
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
            }`}
          >
            {isApproved ? 'Itinerary Synchronized' : isDisrupted ? 'Disruption Active' : 'On Schedule'}
          </span>
        </div>

        {/* Right: Quick Links & Developer Access */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('overview')}
            className="hover:text-foreground transition-colors"
          >
            All Journeys
          </button>
          <button
            onClick={() => onNavigate('workspace')}
            className="hover:text-foreground transition-colors"
          >
            Workspace
          </button>
          <button
            onClick={() => onNavigate('twin-lab')}
            className="hover:text-foreground transition-colors"
          >
            Simulation Lab
          </button>
          <span className="text-border">|</span>
          <button
            onClick={() => onNavigate('developer')}
            className="flex items-center gap-1 text-[11px] font-mono hover:text-foreground transition-colors"
            title="Inspect server telemetry and API provider status"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span>Developer Diagnostics</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

