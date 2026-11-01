import React from 'react';
import { RecoveryOption } from '../../types/travel';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, ArrowRight, Clock, DollarSign, Plane, Sparkles } from 'lucide-react';

interface RouteComparisonMatrixProps {
  options: RecoveryOption[];
  onSelectOptionForReview: (opt: RecoveryOption) => void;
  isApproved: boolean;
  approvedOptionId?: string;
}

export const RouteComparisonMatrix: React.FC<RouteComparisonMatrixProps> = ({
  options,
  onSelectOptionForReview,
  isApproved,
  approvedOptionId,
}) => {
  if (!options || options.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
        <Sparkles className="h-8 w-8 text-blue-500 mx-auto animate-pulse" />
        <h3 className="text-sm font-semibold text-foreground">Evaluating Recovery Pathways</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Executing multi-route constraint audit across arrival deadlines, transit visa barriers, and airline ticketing inventory.
        </p>
      </div>
    );
  }

  // Split into qualified vs disqualified
  const qualifiedOptions = options.filter((o) => o.hardGatePassed);
  const disqualifiedOptions = options.filter((o) => !o.hardGatePassed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Candidate Recovery Pathways
          </h2>
          <p className="text-xs text-muted-foreground">
            Audited through deterministic hard-gate validation ({qualifiedOptions.length} Qualified, {disqualifiedOptions.length} Disqualified)
          </p>
        </div>
      </div>

      {/* Qualified Pathways (Hero Display) */}
      <div className="space-y-4">
        {qualifiedOptions.map((opt) => {
          const isThisOptionApproved = isApproved && approvedOptionId === opt.id;

          return (
            <div
              key={opt.id}
              className={`rounded-xl border p-5 transition-all shadow-sm ${
                isThisOptionApproved
                  ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30'
                  : opt.isRecommended
                  ? 'bg-card border-blue-500/40 ring-1 ring-blue-500/20'
                  : 'bg-card border-border/80'
              }`}
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {opt.isRecommended ? 'Recommended Recovery' : 'Qualified Route'}
                  </span>
                  <span className="text-xs font-mono font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    {opt.recoveryMode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-foreground">
                    Feasibility: {opt.feasibilityScore}/100
                  </span>
                </div>
              </div>

              {/* Title & Carrier */}
              <div className="pt-3.5 space-y-1">
                <h3 className="text-sm font-bold text-foreground">{opt.title}</h3>
                <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 rounded-lg bg-background border border-border/80">
                  <span className="text-[10px] text-muted-foreground block font-mono">Final Arrival</span>
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    {opt.finalArrivalTime}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border/80">
                  <span className="text-[10px] text-muted-foreground block font-mono">Out-of-Pocket Cost</span>
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1 mt-0.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ${opt.outOfPocketCost} USD
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border/80">
                  <span className="text-[10px] text-muted-foreground block font-mono">Carrier / Aircraft</span>
                  <span className="font-semibold text-xs text-foreground truncate block mt-0.5">
                    {opt.carrierSummary}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border/80">
                  <span className="text-[10px] text-muted-foreground block font-mono">Delay Impact</span>
                  <span className="font-semibold text-xs text-foreground mt-0.5 block">
                    +{opt.totalDelayHours.toFixed(1)}h vs schedule
                  </span>
                </div>
              </div>

              {/* Segment Details */}
              {opt.newSegments && opt.newSegments.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1.5 my-3">
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <Plane className="h-3.5 w-3.5 text-blue-500" />
                    <span>Flight Segment: {opt.newSegments[0].code}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-muted-foreground text-[11px] gap-1">
                    <span>Departs: {opt.newSegments[0].departureLocation} @ {opt.newSegments[0].departureTime}</span>
                    <ArrowRight className="h-3 w-3 hidden sm:block text-muted-foreground" />
                    <span>Arrives: {opt.newSegments[0].arrivalLocation} @ {opt.newSegments[0].arrivalTime}</span>
                  </div>
                  {opt.newSegments[0].notes && (
                    <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                      {opt.newSegments[0].notes}
                    </p>
                  )}
                </div>
              )}

              {/* Hard Gate Pass Verification Badges */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Deterministic Hard Gates Verified
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {opt.constraintChecks.map((check, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 p-2 rounded bg-background/60 border border-border/50 text-[11px]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground block">{check.name}</span>
                        <span className="text-muted-foreground leading-tight">{check.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
                <p className="text-xs text-muted-foreground max-w-md hidden sm:block">
                  Requires explicit traveler review of operational assumptions before updating itinerary.
                </p>
                {isThisOptionApproved ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/40">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Itinerary Reconciled & Confirmed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectOptionForReview(opt)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm ml-auto"
                  >
                    <span>Review & Authorize Route</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disqualified Pathways (Fatal Breaches Display) */}
      {disqualifiedOptions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Disqualified Candidate Pathways ({disqualifiedOptions.length})
            </h3>
          </div>

          <div className="space-y-3">
            {disqualifiedOptions.map((opt) => (
              <div
                key={opt.id}
                className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3 opacity-90 hover:opacity-100 transition-opacity"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-semibold">
                      <XCircle className="h-3.5 w-3.5" />
                      Disqualified (Fatal Gate Breach)
                    </span>
                    <span className="text-xs font-bold text-foreground">{opt.title}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-500">
                    Feasibility: 0 / 100
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {opt.subtitle} • Final Arrival: <span className="font-mono text-foreground">{opt.finalArrivalTime}</span> • Cost: <span className="font-mono text-foreground">${opt.outOfPocketCost} USD</span>
                </div>

                {/* Explicit Fatal Breach Messages */}
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                  <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Fatal Gate Breaches ({opt.gateBreaches.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-600 dark:text-rose-300">
                    {opt.gateBreaches.map((breach, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {breach}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Ineligible for traveler confirmation due to strict constraint violation.</span>
                  <button
                    disabled
                    className="px-3 py-1 rounded bg-muted/60 text-muted-foreground/60 text-xs cursor-not-allowed border border-border"
                  >
                    Disqualified
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

