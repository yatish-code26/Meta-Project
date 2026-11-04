import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Calendar,
  Bell,
  Menu,
  CheckCircle2,
  Sliders,
  Shield,
  X,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { globalClock } from '../../services/clockService';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { formatDurationMinutes } from '../../lib/formatters';

interface TopBarProps {
  currentRoute?: string;
  onToggleSidebar?: () => void;
}

export function TopBar({ currentRoute = 'canvas', onToggleSidebar }: TopBarProps) {
  const { state, dispatch, disruptionCalc } = useRouteXStore();
  const [nowTime, setNowTime] = useState<Date>(() => globalClock.now());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showConstraintsPopover, setShowConstraintsPopover] = useState(false);

  useEffect(() => {
    const unsubscribe = globalClock.subscribe((currentDate) => {
      setNowTime(currentDate);
    });
    return () => unsubscribe();
  }, []);

  const unreadNotifs = state.notifications.filter((n) => !n.read).length;
  const isTripPage = currentRoute === 'canvas' || currentRoute === 'recovery' || currentRoute === 'trips';

  // Compute live departure countdown
  const leg1 = state.customUserTripInput?.legs[0];
  const departureDate = leg1
    ? new Date(leg1.departureTimeLocal)
    : new Date('2027-03-10T06:30:00Z');
  const msToDeparture = departureDate.getTime() - nowTime.getTime();
  const minsToDeparture = Math.max(0, Math.round(msToDeparture / 60_000));
  const timeToDepartureStr = formatDurationMinutes(minsToDeparture);

  return (
    <header className="h-16 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0 relative select-none">
      {/* Left: Mobile Toggle & Trip Title (Never Clipped) */}
      <div className="flex items-center gap-3 min-w-0 mr-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-['Manrope'] font-bold text-sm sm:text-base text-foreground truncate max-w-[280px] sm:max-w-md">
              {state.trip.title}
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border hidden lg:inline-block whitespace-nowrap">
              {state.trip.origin.split(' ')[0]} → {state.trip.destination.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right: Exactly 3 Status Chips + Constraints Popover (Only on Trip Pages) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isTripPage && (
          <div className="flex items-center gap-2">
            {/* Chip 1: Deadline */}
            <div
              className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary/80 border border-border text-xs font-semibold text-foreground whitespace-nowrap"
              title="Mandatory arrival deadline"
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Deadline: {state.trip.constraints.hardArrivalDeadline}</span>
            </div>

            {/* Chip 2: Time to Departure */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary/80 border border-border text-xs font-semibold text-foreground whitespace-nowrap"
              title="Time until scheduled departure"
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Departs in: {timeToDepartureStr}</span>
            </div>

            {/* Chip 3: Inbound Delay */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap ${
                disruptionCalc.isConnectionMissed
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
              }`}
              title="Click to inspect in Digital Twin"
            >
              {disruptionCalc.isConnectionMissed ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {disruptionCalc.isConnectionMissed
                  ? `Delay: +${state.params.delayMinutes}m (Breached)`
                  : `Delay: +${state.params.delayMinutes}m (Intact)`}
              </span>
            </button>

            {/* Constraints Popover Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConstraintsPopover(!showConstraintsPopover)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-bold text-foreground transition-colors"
                title="Inspect active hard gates"
              >
                <Sliders className="w-3.5 h-3.5 text-primary" />
                <span className="hidden md:inline">Constraints</span>
              </button>

              {/* Popover Card */}
              {showConstraintsPopover && (
                <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-2xl p-4 shadow-2xl z-50 text-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-primary" />
                      Active Hard Gates
                    </span>
                    <button
                      onClick={() => setShowConstraintsPopover(false)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget Ceiling:</span>
                      <span className="font-bold text-foreground">${state.params.budgetCeiling} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hub MCT Required:</span>
                      <span className="font-bold text-foreground">{state.params.mctBufferMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schengen Visa:</span>
                      <span className="font-bold text-foreground">
                        {state.params.visaAirsideOnly ? 'Airside Only' : 'Permitted'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Baggage Tag:</span>
                      <span className="font-bold text-foreground truncate max-w-[150px]">
                        {state.trip.constraints.baggageTag || 'Direct Check-in'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Icon with Pill Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          {unreadNotifs > 0 && (
            <span className="absolute 1 right-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
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
