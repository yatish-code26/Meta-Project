import React from 'react';
import { Trip } from '../../types/travel';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  Plane,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Briefcase,
  Clock,
  DollarSign,
  User,
  ArrowRight,
  Info,
} from 'lucide-react';

interface TripHeaderProps {
  trip: Trip;
  recoveryState: 'disrupted' | 'options_ready' | 'approved';
}

export const TripHeader: React.FC<TripHeaderProps> = ({ trip, recoveryState }) => {
  return (
    <Card className="border-border/80 bg-card shadow-xl overflow-hidden">
      {/* Top Identity & Flight Route Bar */}
      <div className="bg-gradient-to-r from-secondary/80 via-secondary/40 to-secondary/80 px-6 py-4 border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Plane className="w-5 h-5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase text-cyan-400 font-bold">
                Aviation PNR: {trip.id}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-muted-foreground">Flight Route: Multi-Leg Long Haul</span>
            </div>
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white tracking-tight">
              <span>{trip.origin}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-amber-400 font-mono">FRA (Hub)</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{trip.destination}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border text-xs">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-zinc-200 font-semibold">{trip.travelerName}</span>
            <span className="text-muted-foreground">({trip.travelerTier})</span>
          </div>

          {recoveryState === 'approved' ? (
            <Badge variant="success" className="px-3 py-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Re-planned Itinerary Confirmed
            </Badge>
          ) : (
            <Badge variant="warning" className="px-3 py-1.5 text-xs animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Missed Connection Active
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Scenario Context */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {trip.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Traveler is bound for the Global Tech Symposium at Tokyo International Forum. Arrival is required before Day 2, 14:00 JST to deliver mandatory opening keynote remarks.
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-mono bg-secondary/30 p-2.5 rounded border border-border/50 shrink-0 self-start">
            <div>Schedule: 28 Oct – 04 Nov 2026</div>
            <div className="text-zinc-300">Hub Status: Frankfurt (Terminal 1)</div>
          </div>
        </div>

        {/* Structured Constraint Gates Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Deterministic Traveler Constraints & Gates
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" /> Hard requirements act as disqualify-on-breach gates
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Hard Gate 1 */}
            <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Budget Ceiling
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                  Hard Gate
                </span>
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                ${trip.constraints.maxRecoveryBudget} {trip.constraints.budgetCurrency}
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Approved emergency recovery buffer. Excess cost results in hard disqualification.
              </p>
            </div>

            {/* Hard Gate 2 */}
            <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Arrival Deadline
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                  Hard Gate
                </span>
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                Day 2 • 14:00 JST
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Symposium Opening Doors. Landing after 14:00 JST forfeits keynote commitment.
              </p>
            </div>

            {/* Hard Gate 3 */}
            <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Immigration & Visa
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                  Hard Gate
                </span>
              </div>
              <div className="text-base font-bold text-white">
                Airside Transit Only
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Passenger cannot clear German border. Exiting to landside rail is prohibited.
              </p>
            </div>

            {/* Operational Context */}
            <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  Luggage Tag Status
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-zinc-300 border border-border">
                  Preference
                </span>
              </div>
              <div className="text-base font-bold text-white font-mono text-sm truncate">
                #LH-982341 (Checked)
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Priority auto-interline on Star Alliance. Requires claim if transferring to rail.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
