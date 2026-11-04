import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  Bell,
  Menu,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { globalClock } from '../../services/clockService';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const { state, dispatch, disruptionCalc } = useRouteXStore();
  const [nowTime, setNowTime] = useState<Date>(() => globalClock.now());
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Subscribe to live clock updates
  useEffect(() => {
    const unsubscribe = globalClock.subscribe((currentDate) => {
      setNowTime(currentDate);
    });
    return () => unsubscribe();
  }, []);

  // Compute countdown to LH 716 gate closure (closed at 13:25 CET = 12:25 UTC on 2027-03-10)
  const lh716DepartureUtc = new Date('2027-03-10T12:45:00Z');
  const gateStatus = globalClock.getTimeUntilGateCloses(lh716DepartureUtc, state.params.mctBufferMinutes);

  const unreadNotifs = state.notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
      {/* Left: Mobile Toggle & Trip Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] font-bold text-base sm:text-lg text-foreground truncate">
              {state.trip.destination.split('(')[0].trim()}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border hidden sm:inline-block">
              {state.trip.origin.split(' ')[0]} → {state.trip.destination.split(' ')[0]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate hidden md:block">
            {state.trip.title}
          </p>
        </div>
      </div>

      {/* Center/Right: Live Status Chips (OrbitTrip Style) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Gate Closure / Countdown Chip */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold tabular-nums flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity ${
            gateStatus.isClosed
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-warning/10 border-warning/30 text-warning'
          }`}
          title="Click to inspect in Twin Lab"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>LH 716: {gateStatus.formatted}</span>
        </button>

        {/* Delay Status Chip */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity ${
            disruptionCalc.isConnectionMissed
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-success/10 border-success/30 text-success'
          }`}
          title="Click to inspect in Twin Lab"
        >
          {disruptionCalc.isConnectionMissed ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>
            {disruptionCalc.isConnectionMissed
              ? `Delay: +${state.params.delayMinutes}m (Missed)`
              : `On Time (+${state.params.delayMinutes}m)`}
          </span>
        </button>

        {/* Arrival Deadline Chip */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border text-xs font-semibold text-foreground flex-shrink-0 cursor-pointer hover:bg-secondary transition-colors"
          title="Click to inspect in Twin Lab"
        >
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>Must Arrive: Day 2, 14:00 JST</span>
        </button>

        {/* Budget Left Chip */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex-shrink-0 cursor-pointer hover:bg-primary/20 transition-colors"
          title="Click to inspect in Twin Lab"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Budget: ${state.params.budgetCeiling} Max</span>
        </button>

        {/* Notifications Icon with Pill Badge */}
        <div className="relative ml-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[12px] font-bold flex items-center justify-center">
              {unreadNotifs}
            </span>
          )}
        </div>
      </div>

      {/* In-App Notification Center Modal */}
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </header>
  );
}
