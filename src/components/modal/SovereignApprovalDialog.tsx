import React, { useState } from 'react';
import { RecoveryOption, Trip } from '../../types/travel';
import { X, ShieldCheck, AlertCircle, ArrowRight, Check, Plane, Clock, DollarSign, Calendar } from 'lucide-react';

interface SovereignApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  option: RecoveryOption | null;
  trip: Trip;
  onConfirm: (option: RecoveryOption) => void;
}

export const SovereignApprovalDialog: React.FC<SovereignApprovalDialogProps> = ({
  isOpen,
  onClose,
  option,
  trip,
  onConfirm,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen || !option) return null;

  const originalMissedSegment = trip.itinerary.find((s) => s.status === 'missed');
  const recoverySegment = option.newSegments[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Traveler Sovereign Authorization</h3>
              <p className="text-xs text-muted-foreground">
                Authorize schedule reconciliation before updating active itinerary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Side-by-Side Leg Reconciliation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Cancelled / Missed Leg */}
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500 block">
                Original Flight (Missed / Cancelled)
              </span>
              <div className="font-bold text-sm text-foreground">
                {originalMissedSegment?.code || 'LH 716'} • FRA → HND
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Scheduled Departure: <span className="font-mono text-foreground">{originalMissedSegment?.departureTime || '13:45 CET'}</span></div>
                <div>Scheduled Arrival: <span className="font-mono text-foreground">{originalMissedSegment?.arrivalTime || '10:50 JST (Day 2)'}</span></div>
                <div className="text-rose-500 font-medium text-[11px] pt-1">
                  Boarding closed. Missed due to inbound ATC slot restriction.
                </div>
              </div>
            </div>

            {/* Replacement Recovery Leg */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 block">
                Replacement Recovery Flight
              </span>
              <div className="font-bold text-sm text-foreground">
                {recoverySegment?.code || 'LH 714'} • FRA → HND
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Revised Departure: <span className="font-mono text-foreground">{recoverySegment?.departureTime || '14:55 CET'}</span></div>
                <div>Revised Arrival: <span className="font-mono text-foreground">{recoverySegment?.arrivalTime || '11:40 JST (Day 2)'}</span></div>
                <div className="text-emerald-500 font-medium text-[11px] pt-1">
                  Airside rebook confirmed. Gate B42 (14:15 CET boarding).
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary Bar */}
          <div className="p-3.5 rounded-xl bg-background border border-border grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block font-mono">Out-of-Pocket</span>
              <span className="font-bold text-sm text-emerald-500">
                ${option.outOfPocketCost} USD
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">(100% Airline Covered)</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-mono">Net Delay</span>
              <span className="font-bold text-sm text-foreground">
                +{option.totalDelayHours.toFixed(1)}h
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">vs original flight</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-mono">Keynote Buffer</span>
              <span className="font-bold text-sm text-blue-500">
                2h 20m Margin
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">Before 14:00 doors</span>
            </div>
          </div>

          {/* Operational Assumptions Checklist */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Required Traveler Acknowledgement
            </span>
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-2">
              <p className="text-muted-foreground leading-relaxed">
                By confirming, you authorize RouteX to update your active itinerary and dispatch notifications to hotel concierge. You confirm that you will proceed to Terminal 1 Gate B42 and verify checked baggage claim tag at the service counter.
              </p>
              <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-foreground font-medium text-xs leading-snug">
                  I have reviewed the assumptions, verified my airside visa status, and authorize this itinerary revision.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Review Alternatives
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={() => onConfirm(option)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-md"
          >
            <Check className="h-4 w-4" />
            <span>Confirm & Update Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};

