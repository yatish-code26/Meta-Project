import React from 'react';
import { Trip, RecoveryOption, ApprovalRecord } from '../../types/travel';
import {
  CheckCircle2,
  Calendar,
  Plane,
  Building,
  Briefcase,
  Utensils,
  RotateCcw,
  Clock,
  ShieldCheck,
  MapPin,
  AlertCircle,
  FileCheck,
  Undo2,
} from 'lucide-react';

interface RevisedItineraryTimelineProps {
  trip: Trip;
  approvedOption: RecoveryOption;
  approvalRecord: ApprovalRecord | null;
  onResetSimulation: () => void;
  onRollback?: () => void;
}

export const RevisedItineraryTimeline: React.FC<RevisedItineraryTimelineProps> = ({
  trip,
  approvedOption,
  approvalRecord,
  onResetSimulation,
  onRollback,
}) => {
  return (
    <div className="space-y-6">
      {/* Recovery Success & Audit Banner */}
      <div className="border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-card to-card rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recovery Plan Authorized & Committed
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Audit Ref: REC-2026-LH714-AUTH
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Itinerary Synchronized — Expedition Protected
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {trip.travelerName} authorized <strong>{approvedOption.title}</strong>. Missed segment has been de-scheduled, replacement flight {approvedOption.newSegments[0]?.code || 'LH 714'} has been synchronized into the flight timeline, and all downstream commitments are secured.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {onRollback && (
              <button
                onClick={onRollback}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                title="Revert to Disruption State without resetting sliders"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Rollback Approval</span>
              </button>
            )}
            <button
              onClick={onResetSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Audit Trail Metadata */}
        {approvalRecord && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-background/80 border border-border/80 text-xs font-mono">
            <div>
              <span className="text-muted-foreground block text-[11px]">Authorized Traveler</span>
              <strong className="text-foreground">{approvalRecord.travelerName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Authorization Time</span>
              <strong className="text-foreground">{approvalRecord.approvedAt.slice(11, 19)} UTC</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Cost Variance</span>
              <strong className="text-emerald-500">${approvalRecord.costDelta} USD (EU261 Covered)</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Final Arrival</span>
              <strong className="text-blue-500 font-bold">{approvedOption.finalArrivalTime}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Immediate Next Operational Actions */}
      <div className="border border-blue-500/30 bg-card rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <FileCheck className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-foreground">
            Remaining Operational Next-Steps for Traveler
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {approvedOption.nextSteps.map((step) => (
            <div
              key={step.stepNumber}
              className="rounded-lg border border-border/80 bg-background/60 p-3.5 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600">
                  Step {step.stepNumber}
                </span>
                {step.mandatory ? (
                  <span className="text-[10px] font-bold uppercase text-amber-500">Mandatory</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Automated</span>
                )}
              </div>
              <div className="font-bold text-foreground">{step.location}</div>
              <p className="text-muted-foreground text-[11px] leading-normal">{step.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revised Itinerary Timeline */}
      <div className="border border-border/80 bg-card rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-foreground">
              Live Synchronized Journey Timeline
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {trip.origin} → {trip.destination}
          </span>
        </div>

        <div className="relative border-l-2 border-border/70 ml-4 pl-6 space-y-6 pt-2">
          {/* Step 1: Inbound flight */}
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card" />
            <div className="bg-background/80 border border-border/60 rounded-lg p-3.5 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    09:30 GMT → 13:30 CET
                  </span>
                  <span className="font-bold text-foreground text-xs">{trip.itinerary[0]?.code || 'LH 901'} ({trip.origin} → FRA)</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Delayed (+75m) • Completed
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Inbound flight touched down at Frankfurt Airport Terminal 1 at 13:30 CET.
              </p>
            </div>
          </div>

          {/* Step 2: Cancelled segment */}
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-rose-500 border-4 border-card" />
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3.5 space-y-1 opacity-75">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    13:45 CET
                  </span>
                  <span className="font-bold text-rose-500 text-xs line-through">
                    {trip.itinerary[1]?.code || 'LH 716'} (FRA → HND)
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  MISSED / REPLACED
                </span>
              </div>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                Gate closed at 13:25 CET prior to inbound arrival. Removed from active itinerary.
              </p>
            </div>
          </div>

          {/* Step 3: Approved Recovery Flight */}
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card ring-4 ring-emerald-500/20 animate-pulse" />
            <div className="bg-emerald-500/5 border-2 border-emerald-500/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">
                    RECOVERY FLIGHT CONFIRMED
                  </span>
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-emerald-500" />
                    {approvedOption.carrierSummary}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  Polar Corridor
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-background/80 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block text-[10px] font-mono">Departure (FRA)</span>
                  <strong className="text-foreground text-xs">14:55 CET (Gate B42)</strong>
                </div>
                <div className="bg-background/80 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block text-[10px] font-mono">Arrival ({trip.destination})</span>
                  <strong className="text-blue-500 text-xs font-bold">{approvedOption.finalArrivalTime}</strong>
                </div>
                <div className="bg-background/80 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block text-[10px] font-mono">Baggage Status</span>
                  <strong className="text-emerald-500 text-xs font-bold">Transferred Airside</strong>
                </div>
              </div>

              <div className="text-xs text-muted-foreground leading-relaxed pt-1">
                ✓ Same-alliance involuntary rebook under EU261. Airside transfer in Terminal 1. Leaves 2h 20m safety buffer before keynote doors.
              </div>
            </div>
          </div>

          {/* Step 4: Downstream commitments preserved */}
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-card" />
            <div className="bg-background/80 border border-border/60 rounded-lg p-3.5 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    Day 2 • 14:00 JST
                  </span>
                  <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    Global Tech Symposium Opening Keynote
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  ON SCHEDULE (2h 20m Buffer)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tokyo International Forum, Hall A. Traveler delivers opening address at 14:30 JST with zero conflict.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

