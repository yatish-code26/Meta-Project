import React from 'react';
import { Trip, ItinerarySegment } from '../types/travel';
import { Plane, Building, Briefcase, Clock, ShieldCheck, AlertTriangle, ArrowRight, MapPin, Calendar, CheckCircle2, Luggage, Key, DollarSign } from 'lucide-react';
import { AppView } from '../components/navigation/Navbar';

interface TripWorkspacePageProps {
  trip: Trip;
  onNavigate: (view: AppView) => void;
  isDisrupted: boolean;
  isApproved: boolean;
}

export const TripWorkspacePage: React.FC<TripWorkspacePageProps> = ({
  trip,
  onNavigate,
  isDisrupted,
  isApproved,
}) => {
  return (
    <div className="space-y-8 py-6">
      {/* Route Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
              {trip.id}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {trip.startDate} to {trip.endDate}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {trip.title}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Traveler: <strong>{trip.travelerName}</strong></span>
            <span>•</span>
            <span>Tier: <strong>{trip.travelerTier}</strong></span>
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('disruption')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
              isDisrupted && !isApproved
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Hub Disruption</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Connected Waypoints Track (Inspired by image 4) */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/50 dark:from-slate-900/50 dark:to-slate-900/80 p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-4 border-b border-border/60">
          Journey Waypoint Flow & Transfer Corridor
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              1
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono font-semibold text-muted-foreground block">ORIGIN</span>
              <span className="text-xs font-bold text-foreground block">London Heathrow (LHR)</span>
              <span className="text-[11px] text-muted-foreground font-mono">Terminal 2 • 09:30 GMT</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              2
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono font-semibold text-amber-600 block">TRANSFER HUB</span>
              <span className="text-xs font-bold text-foreground block">Frankfurt Main (FRA)</span>
              <span className="text-[11px] text-muted-foreground font-mono">Terminal 1 • 90m Layover</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              3
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono font-semibold text-muted-foreground block">DESTINATION</span>
              <span className="text-xs font-bold text-foreground block">Tokyo Haneda (HND)</span>
              <span className="text-[11px] text-muted-foreground font-mono">Terminal 3 • 10:50 JST Day 2</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              4
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono font-semibold text-purple-600 block">COMMITMENT</span>
              <span className="text-xs font-bold text-foreground block">Global Tech Symposium</span>
              <span className="text-[11px] text-muted-foreground font-mono">Doors Close: 14:00 JST Day 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Segments Timeline (Left) + Constraints (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Itinerary Segments (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Scheduled Journey Segments</span>
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {trip.itinerary.length} Confirmed Bookings
            </span>
          </div>

          <div className="space-y-3">
            {trip.itinerary.map((segment) => {
              const isFlight = segment.type === 'flight';
              const isMeeting = segment.type === 'meeting';
              const isHotel = segment.type === 'hotel';

              return (
                <div
                  key={segment.id}
                  className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isFlight
                            ? 'bg-blue-500/10 text-blue-600'
                            : isMeeting
                            ? 'bg-purple-500/10 text-purple-600'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        {isFlight ? (
                          <Plane className="w-4 h-4" />
                        ) : isMeeting ? (
                          <Briefcase className="w-4 h-4" />
                        ) : (
                          <Building className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{segment.title}</span>
                          <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-secondary">
                            {segment.code}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{segment.carrier}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        segment.status === 'delayed'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : segment.status === 'missed'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}
                    >
                      {segment.status}
                    </span>
                  </div>

                  {/* Route & Timing Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-secondary/50 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-mono">Departure</span>
                      <strong className="text-foreground">{segment.departureLocation}</strong>
                      <div className="text-muted-foreground font-mono text-[11px]">
                        {segment.departureTime} ({segment.departureTimeZone})
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-mono">Arrival</span>
                      <strong className="text-foreground">{segment.arrivalLocation}</strong>
                      <div className="text-muted-foreground font-mono text-[11px]">
                        {segment.arrivalTime} ({segment.arrivalTimeZone})
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-mono">Duration & Gate</span>
                      <strong className="text-foreground">{segment.duration}</strong>
                      <div className="text-muted-foreground text-[11px]">
                        {segment.terminalGate || 'Confirmed'}
                      </div>
                    </div>
                  </div>

                  {segment.notes && (
                    <p className="text-xs text-muted-foreground font-mono leading-relaxed pt-1 border-t border-border/50">
                      ℹ {segment.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Travel Constraints & Preferences (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">
                Mandatory Travel Constraints
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-secondary/60 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  <span>Hard Arrival Deadline</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {trip.constraints.hardArrivalDeadline}
                </p>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                  Target: &lt; Day 2, 14:00 JST (Door Lock)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/60 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Max Recovery Out-of-Pocket</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Maximum allowable traveler out-of-pocket budget:
                </p>
                <div className="text-sm font-bold text-emerald-600 font-mono">
                  ${trip.constraints.maxRecoveryBudget} USD
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/60 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Transit Visa / Border Status</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {trip.constraints.visaTransitStatus}
                </p>
                <span className="text-[10px] font-bold uppercase text-amber-600 px-1.5 py-0.5 rounded bg-amber-500/10">
                  Landside Border Entry Prohibited
                </span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/60 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Luggage className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Checked Luggage Tag</span>
                </div>
                <div className="font-mono text-xs font-bold text-foreground">
                  {trip.constraints.baggageTag}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
