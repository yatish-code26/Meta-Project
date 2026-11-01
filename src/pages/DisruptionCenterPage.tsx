import React from 'react';
import { Trip, DisruptionEvent } from '../types/travel';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, Plane, CheckCircle2, XCircle, HelpCircle, Sparkles } from 'lucide-react';
import { AppView } from '../components/navigation/Navbar';

interface DisruptionCenterPageProps {
  trip: Trip;
  disruption: DisruptionEvent;
  onNavigate: (view: AppView) => void;
  onLaunchRecovery: () => void;
  isEvaluating: boolean;
}

export const DisruptionCenterPage: React.FC<DisruptionCenterPageProps> = ({
  trip,
  disruption,
  onNavigate,
  onLaunchRecovery,
  isEvaluating,
}) => {
  return (
    <div className="space-y-8 py-6">
      {/* High-Impact Disruption Alert Banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-card to-card p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL DISRUPTION DETECTED
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Location: {disruption.location}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Connection Missed at Frankfurt Hub (FRA)
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Inbound flight <strong>LH 901</strong> from London Heathrow encountered European airspace ATC slot restrictions, delaying arrival by <strong>+75 minutes</strong>. Connecting flight <strong>LH 716</strong> to Tokyo Haneda closed boarding gates prior to inbound touchdown.
            </p>
          </div>

          <button
            onClick={() => {
              onLaunchRecovery();
              onNavigate('options');
            }}
            disabled={isEvaluating}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/30 shrink-0 self-start sm:self-center"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluating ? 'Evaluating Alternatives...' : 'Explore Recovery Pathways'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Disruption Anatomy & Mathematical Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
            1. INBOUND TOUCHDOWN DELAY
          </span>
          <div className="text-2xl font-black text-amber-500 font-mono">
            +75 Mins Late
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Scheduled Landing: <span className="font-mono text-foreground font-semibold">12:15 CET</span></div>
            <div>Actual Landing: <span className="font-mono text-foreground font-semibold">13:30 CET</span></div>
            <p className="pt-2 text-[11px] leading-relaxed border-t border-border">
              European airspace slot restriction delayed departure from London Heathrow by 45m; airborne holding added 30m.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
            2. ONWARD BOARDING LOCK
          </span>
          <div className="text-2xl font-black text-rose-500 font-mono">
            Gates Closed
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Scheduled Departure: <span className="font-mono text-foreground font-semibold">13:45 CET</span></div>
            <div>Boarding Gate Cut-off: <span className="font-mono text-foreground font-semibold">13:25 CET</span></div>
            <p className="pt-2 text-[11px] leading-relaxed border-t border-border">
              LH 716 boarding doors closed 5 minutes before inbound flight LH 901 touched down at Gate A14.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
            3. MINIMUM CONNECTION TIME (MCT)
          </span>
          <div className="text-2xl font-black text-rose-500 font-mono">
            -30m Margin
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Required Hub MCT: <span className="font-mono text-foreground font-semibold">45 Mins</span></div>
            <div>Available Transfer Window: <span className="font-mono text-foreground font-semibold">15 Mins</span></div>
            <p className="pt-2 text-[11px] leading-relaxed border-t border-border">
              Mathematical impossibility: 15 minutes transfer time between Terminal 1 Concourse A and B is 30 minutes below airport minimums.
            </p>
          </div>
        </div>
      </div>

      {/* Downstream Impact Analysis */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-500" />
          <span>Downstream Commitment Consequences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="font-bold text-foreground">
              Hotel Check-in: The Capitol Hotel Tokyu
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Scheduled check-in at 12:00 JST (Day 2) will be delayed. Room reservation requires late arrival dispatch notice.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1.5">
            <div className="font-bold text-rose-600 dark:text-rose-400">
              CRITICAL: Global Tech Symposium Opening Keynote
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Opening doors at 14:00 JST (Day 2). Alex Turner is panel speaker at 14:30 JST. Any recovery route arriving after 14:00 JST forfeits keynote participation.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Deterministic recovery evaluation will audit alternative routes against arrival deadline and visa constraints.
          </p>
          <button
            onClick={() => {
              onLaunchRecovery();
              onNavigate('options');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-sm"
          >
            <span>Proceed to Candidate Pathways</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

