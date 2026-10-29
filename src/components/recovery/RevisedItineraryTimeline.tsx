import React from 'react';
import { Trip, RecoveryOption, ApprovalRecord } from '../../types/travel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
} from 'lucide-react';

interface RevisedItineraryTimelineProps {
  trip: Trip;
  approvedOption: RecoveryOption;
  approvalRecord: ApprovalRecord | null;
  onResetSimulation: () => void;
}

export const RevisedItineraryTimeline: React.FC<RevisedItineraryTimelineProps> = ({
  trip: _trip,
  approvedOption,
  approvalRecord,
  onResetSimulation,
}) => {
  return (
    <div className="space-y-6">
      {/* Recovery Success & Audit Banner */}
      <Card className="border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-card to-card shadow-2xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="success" className="px-3 py-1 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Recovery Plan Authorized & Committed
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  Audit Ref: REC-2026-LH714-AUTH
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight">
                Itinerary Synchronized — Tokyo Expedition Protected
              </h2>

              <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
                Alex Turner authorized <strong>{approvedOption.title}</strong>. Missed segment LH 716 has been de-scheduled, replacement flight LH 714 has been synchronized into the flight timeline, and all downstream Tokyo commitments are secured.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onResetSimulation}
              className="self-start md:self-center text-xs gap-1.5 border-border shrink-0 hover:bg-secondary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Simulation Demo
            </Button>
          </div>

          {/* Audit Trail Metadata */}
          {approvalRecord && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-card/60 border border-border/60 text-xs font-mono">
              <div>
                <span className="text-muted-foreground block text-[11px]">Authorized Traveler</span>
                <strong className="text-white">{approvalRecord.travelerName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Authorization Time</span>
                <strong className="text-white">{approvalRecord.approvedAt.slice(11, 19)} UTC</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Cost Variance</span>
                <strong className="text-emerald-400">$0.00 USD (EU261 Covered)</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Final Tokyo Arrival</span>
                <strong className="text-cyan-300 font-bold">{approvedOption.finalArrivalTime}</strong>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Immediate Next Operational Actions */}
      <Card className="border border-cyan-500/30 bg-card shadow-lg">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Remaining Operational Next-Steps for Traveler
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Clear tasks required before boarding at Frankfurt Airport (FRA).
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {approvedOption.nextSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="telemetry" className="text-[10px]">
                    Step {step.stepNumber}
                  </Badge>
                  {step.mandatory ? (
                    <span className="text-[10px] font-bold uppercase text-amber-400">Mandatory</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Automated</span>
                  )}
                </div>
                <div className="font-bold text-white">{step.location}</div>
                <p className="text-muted-foreground leading-normal">{step.action}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-secondary/20 border border-border/40 text-xs text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Demo Disclaimer:</strong> This hackathon submission prepares a verified recovery plan and audit trail. Live airline ticket reissuance requires integration with an authorized airline PNR booking engine.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Revised Itinerary Timeline */}
      <Card className="border border-border/80 shadow-xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Live Revised Timeline (Tokyo Expedition)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Synchronized sequence following recovery confirmation.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="relative border-l-2 border-border/70 ml-4 pl-6 space-y-6">
            {/* Step 1: Inbound flight LH 901 */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card" />
              <div className="bg-secondary/30 border border-border/60 rounded-lg p-4 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Day 1 • 09:30 GMT → 13:30 CET
                    </Badge>
                    <span className="font-bold text-white text-sm">LH 901 (LHR → FRA)</span>
                  </div>
                  <Badge variant="warning" className="text-xs">
                    Delayed (+75m) • Completed
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Inbound flight touched down at Frankfurt Airport Terminal 1 at 13:30 CET.
                </p>
              </div>
            </div>

            {/* Step 2: Cancelled segment LH 716 */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-rose-500/80 border-4 border-card" />
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-4 space-y-1 opacity-75">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      Day 1 • 13:45 CET
                    </Badge>
                    <span className="font-bold text-rose-300 text-sm line-through">
                      LH 716 (FRA → HND)
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    MISSED / CANCELLED — REPLACED
                  </Badge>
                </div>
                <p className="text-xs text-rose-200/80">
                  Gate closed at 13:25 CET prior to inbound arrival. Removed from active itinerary.
                </p>
              </div>
            </div>

            {/* Step 3: Approved Recovery Flight LH 714 */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card ring-4 ring-emerald-500/20 animate-pulse" />
              <div className="bg-emerald-950/30 border-2 border-emerald-500/60 rounded-lg p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-xs font-bold">
                      RECOVERY FLIGHT CONFIRMED
                    </Badge>
                    <span className="font-bold text-white text-base flex items-center gap-2">
                      <Plane className="w-5 h-5 text-emerald-400 rotate-45" />
                      Lufthansa LH 714 (FRA → HND)
                    </span>
                  </div>
                  <Badge variant="telemetry" className="text-xs">
                    Airbus A350-900 • Polar Corridor
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-card/70 p-2.5 rounded border border-border">
                    <span className="text-muted-foreground block text-[11px]">Departure (Frankfurt)</span>
                    <strong className="text-white text-sm">14:55 CET (Gate B42)</strong>
                  </div>
                  <div className="bg-card/70 p-2.5 rounded border border-border">
                    <span className="text-muted-foreground block text-[11px]">Arrival (Tokyo Haneda)</span>
                    <strong className="text-cyan-300 text-sm font-bold">11:40 JST (Day 2)</strong>
                  </div>
                  <div className="bg-card/70 p-2.5 rounded border border-border">
                    <span className="text-muted-foreground block text-[11px]">Baggage Status</span>
                    <strong className="text-emerald-400 text-sm">Transferred (#LH-982341)</strong>
                  </div>
                </div>

                <div className="text-xs text-emerald-200/90 leading-relaxed">
                  ✓ Same-alliance involuntary rebook under EU261. Airside transfer in Terminal 1. Leaves 2h 20m safety buffer in Tokyo.
                </div>
              </div>
            </div>

            {/* Step 4: Reconciled Capitol Hotel Check-in */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-zinc-500 border-4 border-card" />
              <div className="bg-secondary/30 border border-border/60 rounded-lg p-4 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Day 2 • 12:45 JST
                    </Badge>
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-zinc-400" />
                      Check-in: The Capitol Hotel Tokyu
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                    Rescheduled (+45m)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Late check-in notification sent to concierge. Room guaranteed.
                </p>
              </div>
            </div>

            {/* Step 5: Critical Keynote Meeting */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card" />
              <div className="bg-secondary/30 border border-border/60 rounded-lg p-4 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-amber-300 border-amber-500/30">
                      Day 2 • 14:00 JST (Hard Deadline)
                    </Badge>
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                      Global Tech Symposium Opening Keynote
                    </span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    ON SCHEDULE (2h 20m Buffer)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tokyo International Forum, Hall A. Alex Turner delivers opening address at 14:30 JST.
                </p>
              </div>
            </div>

            {/* Step 6: Welcome Dinner */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-zinc-500 border-4 border-card" />
              <div className="bg-secondary/30 border border-border/60 rounded-lg p-4 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Day 2 • 19:00 JST
                    </Badge>
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-zinc-400" />
                      Executive Welcome Dinner (Ginza)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs text-zinc-400">
                    Unaffected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Confirmed reservation at Ginza Ukai-Tei.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
