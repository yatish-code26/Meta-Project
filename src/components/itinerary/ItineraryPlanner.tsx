import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Plane,
  Building,
  Users,
  Compass,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { ItinerarySegment } from '../../types/travel';

export function ItineraryPlanner() {
  const { state, dispatch, disruptionCalc, evaluatedOptions } = useRouteXStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ItinerarySegment['type']>('meeting');
  const [newDepLocation, setNewDepLocation] = useState('Tokyo (HND)');
  const [newArrLocation, setNewArrLocation] = useState('Tokyo Big Sight Convention Center');
  const [newDepTime, setNewDepTime] = useState('15:00');
  const [newArrTime, setNewArrTime] = useState('16:00');

  // Conflict Detection Engine
  const conflicts: Array<{ segmentId: string; message: string; severity: 'high' | 'medium' }> = [];

  // Check 1: Inbound connection missed conflict
  if (disruptionCalc.isConnectionMissed) {
    conflicts.push({
      segmentId: 'SEG-LH-716',
      message: `Flight LH 716 departure missed due to +${state.params.delayMinutes}m inbound delay (transfer window ${disruptionCalc.effectiveLayoverMinutes}m < 45m MCT).`,
      severity: 'high',
    });
  }

  // Check 2: If an option is reviewed or approved, check downstream keynote commitment
  const activeOption = state.approvalRecord
    ? evaluatedOptions.find((o) => o.id === state.approvalRecord?.optionId)
    : state.selectedOptionForReview;

  if (activeOption) {
    if (activeOption.finalArrivalTime.includes('16:05') || activeOption.finalArrivalTime.includes('Day 3')) {
      conflicts.push({
        segmentId: 'SEG-KEYNOTE',
        message: `Downstream Conflict: Arrival at ${activeOption.finalArrivalTime} misses the Day 2 14:00 JST Keynote Symposium start.`,
        severity: 'high',
      });
    }
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    dispatch({
      type: 'ADD_ITINERARY_ITEM',
      item: {
        type: newType,
        code: newType.toUpperCase().slice(0, 3) + '-' + Math.floor(Math.random() * 900 + 100),
        title: newTitle.trim(),
        carrier: newType === 'flight' ? 'Airline Partner' : 'Local Host',
        departureLocation: newDepLocation.trim(),
        arrivalLocation: newArrLocation.trim(),
        departureTime: newDepTime,
        departureTimeZone: 'JST (UTC+9)',
        arrivalTime: newArrTime,
        arrivalTimeZone: 'JST (UTC+9)',
        duration: '1h 00m',
        dayNumber: 2,
        status: 'scheduled',
      },
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  const getIcon = (type: ItinerarySegment['type']) => {
    switch (type) {
      case 'flight':
        return Plane;
      case 'hotel':
        return Building;
      case 'meeting':
        return Users;
      default:
        return Calendar;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="font-['Manrope'] font-bold text-sm text-foreground">
            Interactive Trip Itinerary
          </h3>
          <p className="text-[12px] text-muted-foreground">
            {state.trip.itinerary.length} scheduled commitments • Deterministic conflict detection
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Activity</span>
        </button>
      </div>

      {/* Conflict Detection Banner */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span>{conflicts.length} Schedule Conflict{conflicts.length > 1 ? 's' : ''} Detected</span>
          </div>
          <div className="space-y-1">
            {conflicts.map((c, i) => (
              <p key={i} className="text-foreground/90 text-[12px] pl-5">
                • {c.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion for Free Time (Labeled Unverified) */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggestion for Free Buffer
          </span>
          <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            AI suggestion — unverified
          </span>
        </div>
        <p className="text-muted-foreground text-[12px] leading-relaxed">
          Identified 3h 10m connection buffer at Frankfurt Airport. Suggested airside rest: Lufthansa Business Lounge Concourse B (Gate B24), accessible with Star Alliance Gold tier.
        </p>
      </div>

      {/* Vertical Connected Timeline (Reference 4 style) */}
      <div className="space-y-3 relative pl-6 border-l-2 border-primary/30 ml-2">
        {state.trip.itinerary.map((seg, idx) => {
          const Icon = getIcon(seg.type);
          const hasConflict = conflicts.some((c) => c.segmentId === seg.id);
          const isRecovered = seg.status === 'recovered';

          return (
            <div key={seg.id} className="relative group">
              {/* Timeline Circular Milestone Node */}
              <div
                className={`absolute -left-[31px] top-3 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm transition-colors ${
                  hasConflict
                    ? 'bg-rose-600 text-white'
                    : isRecovered
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Segment Card */}
              <div
                className={`p-3.5 rounded-xl border bg-card shadow-sm space-y-2 text-xs transition-all ${
                  hasConflict
                    ? 'border-destructive/40 bg-destructive/[0.02]'
                    : isRecovered
                    ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary font-mono text-xs">{seg.code}</span>
                      <span className="font-['Manrope'] font-bold text-foreground text-sm">
                        {seg.title}
                      </span>
                      {isRecovered && (
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Recovered
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-[12px] mt-0.5 block">
                      {seg.carrier}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'DELETE_ITINERARY_ITEM', id: seg.id })}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-muted-foreground bg-secondary/30 p-2 rounded-lg text-xs">
                  <div>
                    <span className="font-semibold text-foreground block">{seg.departureTime}</span>
                    <span className="text-[12px]">{seg.departureLocation}</span>
                  </div>
                  <div className="text-center px-2">
                    <span className="text-[12px] block">→</span>
                    <span className="text-[12px] text-muted-foreground">{seg.duration}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground block">{seg.arrivalTime}</span>
                    <span className="text-[12px]">{seg.arrivalLocation}</span>
                  </div>
                </div>

                {seg.notes && (
                  <p className="text-[12px] text-muted-foreground italic border-t border-border/50 pt-1.5">
                    {seg.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="p-4 rounded-xl border border-primary/30 bg-card shadow-lg space-y-3">
          <h4 className="font-bold text-xs text-foreground">Add Custom Commitment</h4>
          <form onSubmit={handleAddItem} className="space-y-3">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                Activity Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Executive Dinner / Tokyo Lab Tour"
                className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/30 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/30 text-foreground"
                >
                  <option value="meeting">Meeting / Event</option>
                  <option value="hotel">Hotel Check-in</option>
                  <option value="activity">Ground Transfer</option>
                  <option value="flight">Flight</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={newDepTime}
                  onChange={(e) => setNewDepTime(e.target.value)}
                  placeholder="15:00 JST"
                  className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/30 text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
              >
                Save to Itinerary
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

