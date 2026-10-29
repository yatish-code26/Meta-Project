import React, { useState } from 'react';
import { RecoveryOption, Trip } from '../../types/travel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  DollarSign,
  ArrowRight,
  Plane,
  Building,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface TravelerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  option: RecoveryOption | null;
  trip: Trip;
  onConfirmApproval: (option: RecoveryOption) => void;
}

export const TravelerApprovalModal: React.FC<TravelerApprovalModalProps> = ({
  isOpen,
  onClose,
  option,
  trip: _trip,
  onConfirmApproval,
}) => {
  const [hasAcknowledgedAssumptions, setHasAcknowledgedAssumptions] = useState(false);

  if (!option) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Traveler Authorization Gate (Step E)
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Policy: RouteX-AUTONOMY-L2
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Review and Authorize Itinerary Recovery
          </DialogTitle>

          <DialogDescription className="text-sm text-zinc-300">
            RouteX strictly enforces traveler sovereignty. Your booking, tickets, and calendar commitments will not be modified without explicit confirmation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4 text-sm">
          {/* Proposed Recovery Pathway Card */}
          <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selected Recovery Plan
              </span>
              <Badge variant="success" className="text-xs font-semibold">
                Cleared 100% of Hard Gates
              </Badge>
            </div>

            <div>
              <div className="text-base font-bold text-white">{option.title}</div>
              <div className="text-xs text-zinc-300 mt-0.5">{option.carrierSummary}</div>
            </div>

            {/* Side by side metric impact */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 text-xs">
              <div className="flex items-center gap-2 bg-card/60 p-2.5 rounded border border-border">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Revised Arrival in Tokyo</span>
                  <strong className="text-white font-mono">{option.finalArrivalTime}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-card/60 p-2.5 rounded border border-border">
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Out-of-Pocket Expense</span>
                  <strong className="text-emerald-400 font-mono">${option.outOfPocketCost} USD</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Downstream Schedule Impact Analysis */}
          <div className="rounded-lg border border-border/80 bg-secondary/20 p-4 space-y-3">
            <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Automated Downstream Itinerary Reconciliations
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded bg-card/50 border border-border/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Day 2 • 12:45 JST Check-in at The Capitol Hotel Tokyu</strong>
                  <span className="text-muted-foreground">
                    Late arrival notification automatically dispatched to hotel reception. Room guaranteed for late arrival.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded bg-card/50 border border-border/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300 block">Day 2 • 14:00 JST Global Tech Symposium Keynote (PROTECTED)</strong>
                  <span className="text-muted-foreground">
                    Flight lands at 11:40 JST, providing a 2h 20m transfer window to Tokyo International Forum ahead of Alex Turner's 14:30 JST keynote address.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded bg-card/50 border border-border/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Day 2 • 19:00 JST Executive Welcome Dinner (UNTOUCHED)</strong>
                  <span className="text-muted-foreground">
                    Reservation at Ginza Ukai-Tei remains entirely on schedule.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Risk Acknowledgement */}
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 space-y-2 text-xs text-amber-200">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Outstanding Operational Assumptions & Limitations
            </div>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Checked bag #LH-982341 relies on Frankfurt airside luggage transfer to LH 714.</li>
              <li>Final physical boarding pass must be printed at Lufthansa Service Desk B22.</li>
              <li>This demo creates an authorized recovery plan; it does not process live payment or issue airline PNRs.</li>
            </ul>

            <label className="flex items-start gap-2.5 pt-2 mt-2 border-t border-amber-500/30 cursor-pointer text-white font-medium">
              <input
                type="checkbox"
                checked={hasAcknowledgedAssumptions}
                onChange={(e) => setHasAcknowledgedAssumptions(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>
                I acknowledge the operational assumptions and authorize RouteX to synchronize this recovery itinerary.
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/60">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Decline & Back to Alternatives
          </Button>

          <Button
            onClick={() => onConfirmApproval(option)}
            disabled={!hasAcknowledgedAssumptions}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-2 px-5 py-2.5 shadow-md disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Approval & Re-plan Itinerary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
