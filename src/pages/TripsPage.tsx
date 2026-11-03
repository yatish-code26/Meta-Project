import React from 'react';
import { AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Screen } from '../components/navigation/AppHeader';

interface TripsPageProps {
  onNavigate: (s: Screen) => void;
  isDisrupted: boolean;
  isApproved: boolean;
}

interface TripCard {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  date: string;
  status: 'on-time' | 'at-risk' | 'disrupted' | 'confirmed';
  statusLabel: string;
  detail: string;
  primary: boolean;
}

function MiniRouteArc({ from, to }: { from: string; to: string }) {
  return (
    <svg viewBox="0 0 120 46" className="w-full h-12 text-primary" fill="none">
      <circle cx="10" cy="24" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="110" cy="24" r="3" fill="currentColor" opacity="0.6" />
      <path
        d="M10,24 Q60,-2 110,24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      {/* Plane icon midpoint */}
      <path
        d="M57,11 l4,-2 l4,2 l-2,2 l-2,-1 l-2,1 Z"
        fill="currentColor"
        opacity="0.8"
      />
      <text x="6" y="42" fontSize="12" fill="currentColor" opacity="0.85" fontFamily="Inter, sans-serif" fontWeight="600">{from}</text>
      <text x="84" y="42" fontSize="12" fill="currentColor" opacity="0.85" fontFamily="Inter, sans-serif" fontWeight="600">{to}</text>
    </svg>
  );
}

export function TripsPage({ onNavigate, isDisrupted, isApproved }: TripsPageProps) {
  const trips: TripCard[] = [
    {
      id: 'tokyo',
      from: 'LHR', fromCode: 'London',
      to: 'HND', toCode: 'Tokyo',
      date: 'Wed 10 Mar 2027',
      status: isApproved ? 'confirmed' : isDisrupted ? 'disrupted' : 'on-time',
      statusLabel: isApproved ? 'Recovery confirmed' : isDisrupted ? 'Connection missed' : 'On time',
      detail: isApproved
        ? 'LH 714 rebooked · Departs 14:55 CET'
        : isDisrupted
          ? 'LH 716 missed · Frankfurt +75m delay'
          : 'LH 901 → LH 716 via Frankfurt',
      primary: true,
    },
    {
      id: 'nyc',
      from: 'LHR', fromCode: 'London',
      to: 'JFK', toCode: 'New York',
      date: 'Mon 12 Apr 2027',
      status: 'on-time',
      statusLabel: 'On time',
      detail: 'BA 179 · Non-stop · 7h 20m',
      primary: false,
    },
    {
      id: 'london',
      from: 'SFO', fromCode: 'San Francisco',
      to: 'LHR', toCode: 'London',
      date: 'Tue 18 May 2027',
      status: 'on-time',
      statusLabel: 'On time',
      detail: 'UA 901 · Non-stop · 10h 05m',
      primary: false,
    },
  ];

  const statusConfig = {
    'on-time': { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    'at-risk': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    'disrupted': { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
    'confirmed': { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Your trips</p>
        <h1 className="text-4xl sm:text-5xl font-['Fraunces'] text-foreground leading-tight mb-3">
          Kept on track.
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          We watch your connections in real time and show you what to do the moment something changes.
        </p>
      </div>

      {/* Trip cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {trips.map((trip) => {
          const cfg = statusConfig[trip.status];
          const Icon = cfg.icon;

          return (
            <button
              key={trip.id}
              onClick={() => trip.primary && onNavigate('trip')}
              className={`text-left rounded-2xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${trip.primary ? 'ring-2 ring-primary/20 cursor-pointer' : 'opacity-70 cursor-default'
                }`}
            >
              {/* Route arc */}
              <div className="mb-3">
                <MiniRouteArc from={trip.from} to={trip.to} />
              </div>

              {/* Route label */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-['Fraunces'] text-foreground">{trip.fromCode}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-xl font-['Fraunces'] text-foreground">{trip.toCode}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{trip.date}</p>

              {/* Status badge */}
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color} mb-3`}>
                <Icon className="w-3.5 h-3.5" />
                {trip.statusLabel}
              </div>

              <p className="text-sm text-muted-foreground">{trip.detail}</p>

              {trip.primary && (
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm font-medium text-primary flex items-center gap-1">
                    {isDisrupted && !isApproved ? 'See recovery options' : 'View itinerary'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

