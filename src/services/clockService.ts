import { DateTime } from 'luxon';

export type ClockMode = 'demo' | 'real';

export interface CountdownInfo {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isPast: boolean;
}

export interface ClockState {
  mode: ClockMode;
  /** ISO string of current clock instant */
  currentIso: string;
  isPlaying: boolean;
  speedMultiplier: number; // 1x, 5x, 60x for demo fast-forward
}

/**
 * Pinned demo baseline instant:
 * Wednesday 10 March 2027, 13:30:00 CET (Europe/Berlin).
 * This is the exact moment LH 901 touches down at Frankfurt with +75m delay,
 * exactly 15 minutes before LH 716 is scheduled to depart (13:45 CET)
 * and 5 minutes after LH 716 boarding gates locked (13:25 CET).
 */
export const DEFAULT_DEMO_INSTANT = '2027-03-10T13:30:00+01:00';

export class ClockService {
  private mode: ClockMode = 'demo';
  private demoInstant: DateTime;
  private isPlaying = false;
  private speedMultiplier = 1;
  private listeners: Set<(now: Date) => void> = new Set();
  private intervalId: any = null;

  constructor(initialDemoIso: string = DEFAULT_DEMO_INSTANT) {
    this.demoInstant = DateTime.fromISO(initialDemoIso, { setZone: true });
  }

  public getMode(): ClockMode {
    return this.mode;
  }

  public setMode(mode: ClockMode): void {
    this.mode = mode;
    this.notify();
  }

  public now(): Date {
    if (this.mode === 'real') {
      return new Date();
    }
    return this.demoInstant.toJSDate();
  }

  public nowDateTime(zone?: string): DateTime {
    const jsDate = this.now();
    return zone ? DateTime.fromJSDate(jsDate).setZone(zone) : DateTime.fromJSDate(jsDate);
  }

  public setDemoInstant(isoString: string): void {
    this.demoInstant = DateTime.fromISO(isoString, { setZone: true });
    this.notify();
  }

  public advanceDemoMinutes(minutes: number): void {
    this.demoInstant = this.demoInstant.plus({ minutes });
    this.notify();
  }

  public togglePlay(): boolean {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startTicker();
    } else {
      this.stopTicker();
    }
    return this.isPlaying;
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  private startTicker(): void {
    this.stopTicker();
    this.intervalId = setInterval(() => {
      if (this.mode === 'demo') {
        this.demoInstant = this.demoInstant.plus({ seconds: 1 * this.speedMultiplier });
      }
      this.notify();
    }, 1000);
  }

  private stopTicker(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public subscribe(callback: (now: Date) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const current = this.now();
    for (const listener of this.listeners) {
      listener(current);
    }
  }

  /**
   * Calculate live countdown to a target UTC instant
   */
  public getCountdown(targetUtc: Date): CountdownInfo {
    const currentMs = this.now().getTime();
    const targetMs = targetUtc.getTime();
    const diffSeconds = Math.floor((targetMs - currentMs) / 1000);
    const isPast = diffSeconds <= 0;
    const absSeconds = Math.abs(diffSeconds);

    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;

    const formatted = isPast
      ? `${hours > 0 ? `${hours}h ` : ''}${minutes}m ago`
      : `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;

    return {
      totalSeconds: diffSeconds,
      hours,
      minutes,
      seconds,
      formatted,
      isPast,
    };
  }

  /**
   * Time until gate closure (MCT minutes before flight departure)
   */
  public getTimeUntilGateCloses(departureUtc: Date, mctMinutes: number): {
    minutesRemaining: number;
    formatted: string;
    isClosed: boolean;
  } {
    const gateCloseMs = departureUtc.getTime() - mctMinutes * 60_000;
    const currentMs = this.now().getTime();
    const diffMinutes = Math.floor((gateCloseMs - currentMs) / 60_000);
    const isClosed = diffMinutes <= 0;

    return {
      minutesRemaining: diffMinutes,
      isClosed,
      formatted: isClosed
        ? `Gate closed (${Math.abs(diffMinutes)}m ago)`
        : `Closes in ${diffMinutes}m`,
    };
  }
}

// Global singleton instance for application use
export const globalClock = new ClockService();

