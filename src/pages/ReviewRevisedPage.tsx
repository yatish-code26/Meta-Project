import React, { useState } from 'react';
import { Trip, RecoveryOption, ApprovalRecord } from '../types/travel';
import { ShieldCheck, CheckCircle2, RotateCcw, Undo2, Calendar, Plane, Building, Briefcase, Clock, DollarSign, MapPin, ArrowRight, FileCheck, AlertCircle } from 'lucide-react';
import { AppView } from '../components/navigation/Navbar';

interface ReviewRevisedPageProps {
  trip: Trip;
  approvedOption: RecoveryOption | null;
  approvalRecord: ApprovalRecord | null;
  onConfirmApproval: (opt: RecoveryOption) => void;
  onRollback: () => void;
  onResetSimulation: () => void;
  onNavigate: (view: AppView) => void;
  defaultCandidate: RecoveryOption | null;
}

export const ReviewRevisedPage: React.FC<ReviewRevisedPageProps> = ({
  trip,
  approvedOption,
  approvalRecord,
  onConfirmApproval,
  onRollback,
  onResetSimulation,
  onNavigate,
  defaultCandidate,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const activeOption = approvedOption || defaultCandidate;

  if (!activeOption) {
    return (
      <div className="p-12 text-center space-y-3">
        <h3 className="font-bold text-base text-foreground">No Recovery Option Selected</h3>
        <p className="text-xs text-muted-foreground">
          Please select a qualified recovery pathway from the Recovery Options page before reviewing.
        </p>
        <button
          onClick={() => onNavigate('options')}
          className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold text-xs shadow-md"
        >
          View Recovery Options
        </button>
      </div>
    );
  }

  const isApproved = !!approvalRecord;
  const originalMissedSegment = trip.itinerary.find((s) => s.status === 'missed');
  const recoverySegment = activeOption.newSegments[0];

  return (
    <div className="space-y-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                isApproved
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
              }`}
            >
              {isApproved ? 'Itinerary Synchronized' : 'Authorization Pending'}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Ref: {isApproved ? 'REC-2026-LH714-AUTH' : 'PENDING-AUTH'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {isApproved ? 'Synchronized Expedition Timeline' : 'Traveler Sovereign Authorization'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isApproved
              ? 'Your flight timeline has been updated and downstream Tokyo commitments are secured.'
              : 'Review the proposed flight substitution and authorize the change before your itinerary is updated.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {isApproved && (
            <button
              onClick={onRollback}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-all shadow-sm"
              title="Rollback approval to test the authorization gate again"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Rollback Approval</span>
            </button>
          )}
          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* If Not Approved: Show Sovereign Authorization Gate */}
      {!isApproved ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-500/30 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Review Flight Substitution: {activeOption.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Compare the missed flight with the replacement route before committing.
                </p>
              </div>
            </div>

            {/* Side-by-side Flight Reconciliation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cancelled Flight */}
              <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500 block">
                  MISSED FLIGHT (CANCELLED)
                </span>
                <div className="font-bold text-base text-foreground">
                  {originalMissedSegment?.code || 'LH 716'} • Frankfurt (FRA) &rarr; Tokyo Haneda (HND)
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                  <div>Departure: <span className="font-mono text-foreground">13:45 CET</span></div>
                  <div>Scheduled Arrival: <span className="font-mono text-foreground">10:50 JST (Day 2)</span></div>
                  <div className="text-rose-500 font-semibold text-[11px] pt-1">
                    Gates closed at 13:25 CET. Inbound arrival was 13:30 CET.
                  </div>
                </div>
              </div>

              {/* Replacement Recovery Flight */}
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 block">
                  CONFIRMED REPLACEMENT FLIGHT
                </span>
                <div className="font-bold text-base text-foreground">
                  {recoverySegment?.code || 'LH 714'} • Frankfurt (FRA) &rarr; Tokyo Haneda (HND)
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                  <div>Departure: <span className="font-mono text-foreground font-semibold">14:55 CET (Gate B42)</span></div>
                  <div>Revised Arrival: <span className="font-mono text-foreground font-semibold">11:40 JST (Day 2)</span></div>
                  <div className="text-emerald-600 font-semibold text-[11px] pt-1">
                    Direct rebook under EU261. Leaves 2h 20m before keynote doors.
                  </div>
                </div>
              </div>
            </div>

            {/* Reconciliation Metric Pills */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-secondary/50 border border-border/80 text-center text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block font-mono">Out-of-Pocket Cost</span>
                <strong className="text-base font-bold text-emerald-600 font-mono">
                  ${activeOption.outOfPocketCost} USD
                </strong>
                <span className="text-[10px] text-muted-foreground block">(Airline covered)</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-mono">Arrival Variance</span>
                <strong className="text-base font-bold text-foreground font-mono">
                  +{activeOption.totalDelayHours.toFixed(1)}h
                </strong>
                <span className="text-[10px] text-muted-foreground block">vs original flight</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-mono">Keynote Buffer</span>
                <strong className="text-base font-bold text-blue-600 font-mono">
                  2h 20m Margin
                </strong>
                <span className="text-[10px] text-muted-foreground block">Before 14:00 JST doors</span>
              </div>
            </div>

            {/* Mandatory Traveler Acknowledgment */}
            <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-foreground font-medium leading-relaxed">
                  I authorize RouteX to update my flight schedule. I confirm that I remain in Terminal 1 Non-Schengen transit, will collect boarding cards at Lufthansa Service Center B22, and understand this is an operational simulation.
                </span>
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => onNavigate('options')}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  &larr; Choose Different Option
                </button>
                <button
                  type="button"
                  disabled={!acknowledged}
                  onClick={() => onConfirmApproval(activeOption)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize & Commit Itinerary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* If Approved: Show Synchronized Itinerary Timeline */
        <div className="space-y-6">
          {/* Confirmed Banner */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-card to-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RECOVERY PLAN COMMITTED
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Authorized by {trip.travelerName}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Tokyo Expedition Rescheduled & Secured
              </h2>
              <p className="text-xs text-muted-foreground">
                Cancelled flight LH 716 de-scheduled. Replacement flight LH 714 active with Gate B42 and airside baggage transfer.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border text-center font-mono text-xs shrink-0">
              <span className="text-muted-foreground block text-[10px]">Tokyo Arrival</span>
              <strong className="text-blue-600 font-bold text-sm">{activeOption.finalArrivalTime}</strong>
            </div>
          </div>

          {/* Action Steps Card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-500" />
              <span>Immediate In-Airport Action Steps</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeOption.nextSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600">
                      Step {step.stepNumber}
                    </span>
                    {step.mandatory ? (
                      <span className="text-[10px] font-bold uppercase text-amber-600">Mandatory</span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Automated</span>
                    )}
                  </div>
                  <div className="font-bold text-foreground">{step.location}</div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{step.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Synchronized Journey Timeline */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Synchronized Expedition Sequence</span>
            </h3>

            <div className="relative border-l-2 border-border/80 ml-4 pl-6 space-y-6 pt-1">
              {/* Step 1: Inbound flight LH 901 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card" />
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-foreground text-xs">
                      LH 901 • London Heathrow (LHR) &rarr; Frankfurt (FRA)
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Delayed (+75m) • Completed
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Departed 09:30 GMT. Touched down Frankfurt Terminal 1 Gate A14 at 13:30 CET.
                  </p>
                </div>
              </div>

              {/* Step 2: Cancelled flight LH 716 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-rose-500 border-4 border-card" />
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-1 opacity-70">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-rose-600 text-xs line-through">
                      LH 716 • Frankfurt (FRA) &rarr; Tokyo Haneda (HND)
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      MISSED / REPLACED
                    </span>
                  </div>
                  <p className="text-xs text-rose-600/80">
                    Gates closed at 13:25 CET. Removed from active itinerary.
                  </p>
                </div>
              </div>

              {/* Step 3: Replacement flight LH 714 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card ring-4 ring-emerald-500/20" />
                <div className="bg-emerald-500/5 border-2 border-emerald-500/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Plane className="w-4 h-4 text-emerald-600" />
                      Lufthansa LH 714 • Frankfurt (FRA) &rarr; Tokyo Haneda (HND)
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      RECOVERY CONFIRMED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-card p-2.5 rounded-lg border border-border">
                      <span className="text-muted-foreground block text-[10px] font-mono">Departure</span>
                      <strong className="text-foreground">14:55 CET (Gate B42)</strong>
                    </div>
                    <div className="bg-card p-2.5 rounded-lg border border-border">
                      <span className="text-muted-foreground block text-[10px] font-mono">Arrival</span>
                      <strong className="text-blue-600 font-bold">{activeOption.finalArrivalTime}</strong>
                    </div>
                    <div className="bg-card p-2.5 rounded-lg border border-border">
                      <span className="text-muted-foreground block text-[10px] font-mono">Baggage Transfer</span>
                      <strong className="text-emerald-600">Airside (#LH-982341)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Reconciled Hotel Check-in */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-400 border-4 border-card" />
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      Check-in: The Capitol Hotel Tokyu
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      Rescheduled: Day 2 • 12:45 JST (+45m)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Concierge late arrival notice dispatched. Room guaranteed.
                  </p>
                </div>
              </div>

              {/* Step 5: Critical Keynote Meeting */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-card" />
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      CRITICAL: Global Tech Symposium Opening Keynote
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      ON SCHEDULE (2h 20m Buffer)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tokyo International Forum, Hall A. Alex Turner delivers opening address at 14:30 JST with zero conflict.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

