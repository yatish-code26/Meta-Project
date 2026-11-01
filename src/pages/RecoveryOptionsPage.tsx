import React from 'react';
import { RecoveryOption, Trip } from '../types/travel';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Clock, DollarSign, Plane, Sliders, AlertTriangle } from 'lucide-react';
import { AppView } from '../components/navigation/Navbar';
import { AssumptionsDrawer } from '../components/twin/AssumptionsDrawer';

interface RecoveryOptionsPageProps {
  trip: Trip;
  options: RecoveryOption[];
  onSelectOptionForReview: (option: RecoveryOption) => void;
  onNavigate: (view: AppView) => void;
  isApproved: boolean;
  approvedOptionId?: string;
}

export const RecoveryOptionsPage: React.FC<RecoveryOptionsPageProps> = ({
  trip,
  options,
  onSelectOptionForReview,
  onNavigate,
  isApproved,
  approvedOptionId,
}) => {
  const qualifiedOptions = options.filter((o) => o.hardGatePassed);
  const disqualifiedOptions = options.filter((o) => !o.hardGatePassed);
  const primaryOption = qualifiedOptions[0] || options[0];

  return (
    <div className="space-y-8 py-6">
      {/* Header & Twin Lab Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Deterministic Gate Audit
            </span>
            <span className="text-xs text-muted-foreground">
              {qualifiedOptions.length} Qualified • {disqualifiedOptions.length} Disqualified
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Evaluated Recovery Pathways
          </h1>
          <p className="text-xs text-muted-foreground">
            Alternative routes evaluated against your Day 2 14:00 JST arrival deadline, $450 USD budget limit, and Airside Schengen visa restriction.
          </p>
        </div>

        <button
          onClick={() => onNavigate('twin-lab')}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-all shrink-0 self-start sm:self-center"
        >
          <Sliders className="w-4 h-4" />
          <span>Open Recovery Twin™ Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Qualified Pathways (Hero Rows inspired by Triprise image 2) */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Qualified Route Candidates</span>
        </h2>

        {qualifiedOptions.length === 0 ? (
          <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="font-bold text-sm text-foreground">No Feasible Pathways Found Under Strict Constraints</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              All candidate options fail either the hard arrival deadline, budget ceiling, or immigration restrictions. Visit the Recovery Twin™ Lab to explore trade-offs.
            </p>
          </div>
        ) : (
          qualifiedOptions.map((opt) => {
            const isThisApproved = isApproved && approvedOptionId === opt.id;

            return (
              <div
                key={opt.id}
                className={`rounded-2xl border p-6 transition-all shadow-sm ${
                  isThisApproved
                    ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                    : 'border-blue-500/40 bg-card hover:border-blue-500'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {opt.isRecommended ? 'Recommended Recovery' : 'Qualified Alternative'}
                    </span>
                    <span className="text-xs font-mono font-medium text-muted-foreground px-2 py-0.5 rounded bg-secondary">
                      {opt.recoveryMode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-foreground">
                      Feasibility Score: <span className="text-blue-600 text-sm">{opt.feasibilityScore}/100</span>
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="py-4 space-y-2">
                  <h3 className="text-base font-bold text-foreground">{opt.title}</h3>
                  <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                </div>

                {/* Flight Metrics Grid (Airy, highly readable) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-secondary/50 border border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-mono">Final Tokyo Arrival</span>
                    <strong className="text-foreground text-sm font-bold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {opt.finalArrivalTime}
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-medium block">
                      2h 20m before keynote doors
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block font-mono">Out-of-Pocket Cost</span>
                    <strong className="text-emerald-600 text-sm font-bold flex items-center gap-1 mt-0.5 font-mono">
                      <DollarSign className="w-3.5 h-3.5 shrink-0" />
                      ${opt.outOfPocketCost} USD
                    </strong>
                    <span className="text-[10px] text-muted-foreground block">
                      Airline covered under EU261
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block font-mono">Flight & Aircraft</span>
                    <strong className="text-foreground text-xs block mt-0.5">
                      {opt.carrierSummary}
                    </strong>
                    <span className="text-[10px] text-muted-foreground block">
                      Airside transfer (Terminal 1)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block font-mono">Net Delay Impact</span>
                    <strong className="text-foreground text-xs block mt-0.5">
                      +{opt.totalDelayHours.toFixed(1)}h vs schedule
                    </strong>
                    <span className="text-[10px] text-muted-foreground block">
                      Minimal schedule disruption
                    </span>
                  </div>
                </div>

                {/* Hard Gate Pass Verification Badges */}
                <div className="pt-4 space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Verified Deterministic Gates
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {opt.constraintChecks.map((check, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2.5 rounded-lg bg-card border border-border/80 text-[11px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground block">{check.name}</strong>
                          <span className="text-muted-foreground leading-tight">{check.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-5 mt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Requires explicit traveler review of operational assumptions before itinerary update.
                  </p>
                  {isThisApproved ? (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Itinerary Reconciled & Confirmed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectOptionForReview(opt)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
                    >
                      <span>Review & Authorize Route</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Disqualified Candidate Routes */}
      {disqualifiedOptions.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Disqualified Routes ({disqualifiedOptions.length} Failed Hard Gates)</span>
          </h2>

          <div className="space-y-3">
            {disqualifiedOptions.map((opt) => (
              <div
                key={opt.id}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-3 opacity-90 hover:opacity-100 transition-opacity"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[11px] font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      Disqualified
                    </span>
                    <strong className="text-xs text-foreground">{opt.title}</strong>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600">
                    Feasibility: 0 / 100
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">
                    Fatal Constraint Breaches:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-600 dark:text-rose-300">
                    {opt.gateBreaches.map((breach, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {breach}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Arrival: {opt.finalArrivalTime} • Extra Cost: ${opt.outOfPocketCost} USD</span>
                  <button
                    disabled
                    className="px-3 py-1 rounded-full bg-muted/60 text-muted-foreground/60 text-xs cursor-not-allowed border border-border"
                  >
                    Ineligible
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions & Verification Drawer */}
      {primaryOption && (
        <div className="pt-6 border-t border-border">
          <AssumptionsDrawer
            assumptions={primaryOption.assumptions}
            nextSteps={primaryOption.nextSteps}
          />
        </div>
      )}
    </div>
  );
};

