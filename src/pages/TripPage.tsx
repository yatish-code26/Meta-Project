import React from 'react';
import { AlertTriangle, Clock, ArrowRight, Plane, Hotel, Users, Coffee } from 'lucide-react';
import { Trip } from '../types/travel';
import { RouteMap } from '../components/map/RouteMap';
import { Screen } from '../components/navigation/AppHeader';

interface TripPageProps {
  trip: Trip;
  delayMinutes: number;
  isDisrupted: boolean;
  isApproved: boolean;
  onNavigate: (s: Screen) => void;
}

const segmentIcons: Record<string, React.ElementType> = {
  flight: Plane,
  hotel: Hotel,
  meeting: Users,
  activity: Coffee,
  train: ArrowRight,
};

const segmentStatusColors: Record<string, string> = {
  delayed: 'border-l-warning text-warning',
  missed:  'border-l-destructive text-destructive',
  scheduled: 'border-l-success text-success',
  confirmed: 'border-l-primary text-primary',
};

export function TripPage({ trip, delayMinutes, isDisrupted, isApproved, onNavigate }: TripPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Trip header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {trip.startDate} → {trip.endDate}
        </p>
        <h1 className="text-3xl sm:text-4xl font-['Fraunces'] text-foreground mb-1">
          {trip.origin.split('(')[0].trim()}
          <span className="mx-2 text-muted-foreground font-['Inter'] font-light">→</span>
          {trip.destination.split('(')[0].trim()}
        </h1>
        <p className="text-muted-foreground">{trip.title}</p>
      </div>

      {/* Disruption banner */}
      {isDisrupted && !isApproved && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/8 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Your Frankfurt connection is at risk.</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              LH 901 arrived {delayMinutes}m late. LH 716 closed gates before you landed.
            </p>
          </div>
          <button
            onClick={() => onNavigate('recovery')}
            className="flex-shrink-0 rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
          >
            See options
          </button>
        </div>
      )}

      {isApproved && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/8 p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <ArrowRight className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground">LH 714 confirmed · Departs 14:55 CET</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Arrives Tokyo 11:40 JST Day 2 — 2h 20m before your keynote. You're on track.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <RouteMap isDisrupted={isDisrupted} isApproved={isApproved} width={700} height={280} />
        </div>

        {/* Boarding-pass cards */}
        <div className="lg:col-span-2 space-y-3">
          {trip.itinerary.map((seg, idx) => {
            const Icon = segmentIcons[seg.type] ?? Plane;
            const colorClass = segmentStatusColors[seg.status] ?? 'border-l-muted text-muted-foreground';
            const isNextAfterDelay = seg.id === 'seg-1' && isDisrupted;

            return (
              <div key={seg.id}>
                {/* Connection gap indicator */}
                {idx > 0 && seg.type === 'flight' && trip.itinerary[idx - 1].type === 'flight' && (
                  <div className="flex items-center gap-2 py-1.5 px-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className={`text-xs font-medium tabular-nums px-2 py-0.5 rounded-full ${
                      isDisrupted && idx === 1
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isDisrupted && idx === 1 ? '15m layover — missed' : '90m layover'}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                <div className={`rounded-xl border bg-card border-l-4 ${colorClass.split(' ')[0]} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{seg.code}</p>
                        <p className="text-xs text-muted-foreground truncate">{seg.carrier}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium capitalize flex-shrink-0 ${colorClass.split(' ')[1]}`}>
                      {seg.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold tabular-nums">{seg.departureTime}</p>
                      <p className="text-xs text-muted-foreground">{seg.departureTimeZone?.replace(/\s*\(.*\)/, '')}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{seg.arrivalTime}</p>
                      <p className="text-xs text-muted-foreground">{seg.arrivalTimeZone?.replace(/\s*\(.*\)/, '')}</p>
                    </div>
                  </div>

                  {seg.notes && (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">
                      {seg.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

