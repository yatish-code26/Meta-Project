import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { globalClock } from '../../services/clockService';

export function DecisionHorizon() {
  const { state, evaluatedOptions } = useRouteXStore();
  const [now, setNow] = useState<Date>(() => globalClock.now());

  // Editable assumptions for decision horizon
  const [bookingCutoffMins, setBookingCutoffMins] = useState<number>(60);
  const [checkinCutoffMins, setCheckinCutoffMins] = useState<number>(45);

  useEffect(() => {
    const unsub = globalClock.subscribe((dt) => setNow(dt));
    return () => unsub();
  }, []);

  // Compute departure instant for reference option (e.g. 13:45 UTC on 2027-03-10)
  const departureDate = new Date('2027-03-10T12:45:00Z');
  const nowMs = now.getTime();
  const depMs = departureDate.getTime();

  // Booking cutoff instant
  const bookingCutoffMs = depMs - bookingCutoffMins * 60_000;
  const bookingMsRemaining = bookingCutoffMs - nowMs;
  const bookingMinsRemaining = Math.round(bookingMsRemaining / 60_000);

  // Checkin cutoff instant
  const checkinCutoffMs = depMs - checkinCutoffMins * 60_000;
  const checkinMsRemaining = checkinCutoffMs - nowMs;
  const checkinMinsRemaining = Math.round(checkinMsRemaining / 60_000);

  const isBookingExpired = bookingMinsRemaining <= 0;
  const isCheckinExpired = checkinMinsRemaining <= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Decision Horizon (Commitment Countdown)
          </h4>
        </div>
        <span
          className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
            isBookingExpired
              ? 'bg-rose-100 text-rose-800'
              : bookingMinsRemaining <= 15
              ? 'bg-amber-100 text-amber-800 animate-pulse'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {isBookingExpired ? 'Lockout Active' : `${bookingMinsRemaining}m to Commit`}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Real-time countdown to airline inventory lock and boarding gate closure. Once a decision window passes,
        inventory releases to standby travelers and recovery paths expire.
      </p>

      {/* Countdown Timers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className={`p-3 rounded-xl border ${
            isBookingExpired
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700'
              : bookingMinsRemaining <= 15
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700'
              : 'bg-secondary/40 border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              GDS Reservation Lock
            </span>
            <span className="font-bold text-[11px]">
              {isBookingExpired ? 'EXPIRED' : 'ACTIVE'}
            </span>
          </div>
          <div className="text-xl font-extrabold tabular-nums">
            {isBookingExpired ? '00:00' : `${Math.max(0, bookingMinsRemaining)}m remaining`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Cutoff: {bookingCutoffMins}m prior to flight departure
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isCheckinExpired
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700'
              : 'bg-secondary/40 border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Baggage & Boarding Gate
            </span>
            <span className="font-bold text-[11px]">
              {isCheckinExpired ? 'LOCKED' : 'OPEN'}
            </span>
          </div>
          <div className="text-xl font-extrabold tabular-nums">
            {isCheckinExpired ? '00:00' : `${Math.max(0, checkinMinsRemaining)}m remaining`}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Cutoff: {checkinCutoffMins}m prior to flight departure
          </div>
        </div>
      </div>

      {/* Editable Horizon Assumptions */}
      <div className="p-3 rounded-xl border border-border bg-secondary/20 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Horizon Policy Assumptions (Editable)
        </span>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1">Booking Window Cutoff</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={15}
                max={180}
                step={5}
                value={bookingCutoffMins}
                onChange={(e) => setBookingCutoffMins(parseInt(e.target.value, 10) || 60)}
                className="w-20 bg-card border border-border rounded px-2 py-1 text-xs font-bold text-foreground"
              />
              <span className="text-[11px] text-muted-foreground">mins</span>
            </div>
          </div>
          <div>
            <label className="block text-muted-foreground mb-1">Gate Check-in Cutoff</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={15}
                max={90}
                step={5}
                value={checkinCutoffMins}
                onChange={(e) => setCheckinCutoffMins(parseInt(e.target.value, 10) || 45)}
                className="w-20 bg-card border border-border rounded px-2 py-1 text-xs font-bold text-foreground"
              />
              <span className="text-[11px] text-muted-foreground">mins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

