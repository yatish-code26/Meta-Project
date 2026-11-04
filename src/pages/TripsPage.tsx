import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import { useRouteXStore } from '../context/RouteXStore';

interface TripsPageProps {
  onNavigate: (s: string) => void;
  onOpenNewTrip?: () => void;
  isDisrupted: boolean;
  isApproved: boolean;
}

interface TripItem {
  id: string;
  title: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  departureTime: string;
  departureCountdown: string;
  riskPercent: number;
  status: 'on-time' | 'at-risk' | 'disrupted' | 'confirmed';
  statusLabel: string;
  detail: string;
  isCustom?: boolean;
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
      <path
        d="M57,11 l4,-2 l4,2 l-2,2 l-2,-1 l-2,1 Z"
        fill="currentColor"
        opacity="0.8"
      />
      <text x="6" y="42" fontSize="11" fill="currentColor" opacity="0.85" fontFamily="Inter, sans-serif" fontWeight="600">{from}</text>
      <text x="84" y="42" fontSize="11" fill="currentColor" opacity="0.85" fontFamily="Inter, sans-serif" fontWeight="600">{to}</text>
    </svg>
  );
}

export function TripsPage({
  onNavigate,
  onOpenNewTrip,
  isDisrupted,
  isApproved,
}: TripsPageProps) {
  const { state, dispatch } = useRouteXStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on-time' | 'disrupted'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'risk' | 'name'>('date');

  // Derive active trips from store
  const activeTrip: TripItem = {
    id: state.trip.id,
    title: state.trip.title,
    from: state.trip.origin.split(' ')[0],
    fromCity: state.trip.origin,
    to: state.trip.destination.split(' ')[0],
    toCity: state.trip.destination,
    departureTime: '10 Mar 2027',
    departureCountdown: 'Departs in 14 h 30 min',
    riskPercent: isDisrupted && !isApproved ? 92 : 8,
    status: isApproved ? 'confirmed' : isDisrupted ? 'disrupted' : 'on-time',
    statusLabel: isApproved ? 'Recovery Confirmed' : isDisrupted ? 'Connection Missed' : 'On Time',
    detail: isApproved
      ? 'Recovery flight rebooked · Confirmed'
      : isDisrupted
      ? `Delay +${state.params.delayMinutes}m · Fails hub MCT`
      : 'All flight legs on schedule',
  };

  const presetTrips: TripItem[] = [
    activeTrip,
    {
      id: 'nyc-delegation',
      title: 'UN Climate Delegation',
      from: 'LHR',
      fromCity: 'London Heathrow',
      to: 'JFK',
      toCity: 'New York JFK',
      departureTime: '12 Apr 2027',
      departureCountdown: 'Departs in 33 days',
      riskPercent: 12,
      status: 'on-time',
      statusLabel: 'On Time',
      detail: 'Direct transatlantic service · Star Alliance',
    },
    {
      id: 'london-board',
      title: 'European Executive Board',
      from: 'FRA',
      fromCity: 'Frankfurt Hub',
      to: 'ORD',
      toCity: 'Chicago O\'Hare',
      departureTime: '18 May 2027',
      departureCountdown: 'Departs in 69 days',
      riskPercent: 18,
      status: 'on-time',
      statusLabel: 'On Time',
      detail: 'Connecting via LHR · 2h layover',
    },
  ];

  // Filter & sort
  const filteredTrips = presetTrips
    .filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'disrupted' ? t.status === 'disrupted' : t.status === 'on-time' || t.status === 'confirmed');

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'risk') return b.riskPercent - a.riskPercent;
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return 0;
    });

  const statusConfig = {
    'on-time': { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    'at-risk': { icon: Clock, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    'disrupted': { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
    'confirmed': { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Itinerary Portfolio
          </span>
          <h1 className="text-3xl sm:text-4xl font-['Manrope'] font-extrabold text-foreground tracking-tight mt-1">
            Your Trips & Active Connections
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track connections and physical transfer buffers the moment delay telemetry changes.
          </p>
        </div>

        <button
          type="button"
          data-testid="new-trip-btn"
          onClick={onOpenNewTrip}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Trip Wizard</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-secondary/30 p-3 rounded-xl border border-border text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, airport, title..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filters & Sort */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-semibold mr-1">Status:</span>
            {(['all', 'on-time', 'disrupted'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-md capitalize font-bold text-xs ${
                  statusFilter === filter
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'on-time' ? 'On Time' : 'Disrupted'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-muted-foreground font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-card border border-border rounded-lg px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="risk">Risk %</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trip Cards Grid */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map((trip) => {
            const cfg = statusConfig[trip.status];
            const Icon = cfg.icon;

            return (
              <div
                key={trip.id}
                onClick={() => onNavigate('canvas')}
                className="text-left rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Route Arc */}
                  <div className="mb-2">
                    <MiniRouteArc from={trip.from} to={trip.to} />
                  </div>

                  {/* Title & Cities */}
                  <h3 className="font-['Manrope'] font-bold text-base text-foreground truncate">
                    {trip.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 mb-3">
                    <span>{trip.departureTime}</span>
                    <span className="font-semibold text-foreground">{trip.departureCountdown}</span>
                  </div>

                  {/* Status & Risk Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{trip.statusLabel}</span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        trip.riskPercent >= 50
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      Risk: {trip.riskPercent}%
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{trip.detail}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
                  <span>Open Recovery Canvas</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground space-y-3">
          <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h4 className="font-bold text-foreground text-sm">No Matching Trips Found</h4>
          <p className="text-xs max-w-sm mx-auto">
            No active trips matched your current search and filter criteria. You can create a new trip or reload an example.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenNewTrip}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Trip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 border border-border"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
