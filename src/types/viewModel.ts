/**
 * viewModel.ts
 * ============
 * The SINGLE view-model that the engine outputs and the UI only renders.
 * UI components must never recompute times, margins, or feasibility.
 * All derived values live here.
 */

/** Whether the original connection is intact or broken after applying the delay. */
export type ConnectionStatus = 'INTACT' | 'TIGHT' | 'MISSED';

/** Provider/mode badge shown in the developer status area (never in the main UI). */
export type ProviderMode = 'GROQ_LIVE' | 'FIXTURE' | 'SIMULATION';

/** One evaluated recovery candidate ready for rendering. */
export interface EvaluatedOption {
  id: string;
  title: string;
  subtitle: string;
  recoveryMode: string;
  carrierSummary: string;
  /** UTC departure of the first new segment (ISO 8601). */
  firstSegmentDepartureUtc: string;
  /** Local time label for display, e.g. "14:55 CET". */
  firstSegmentDepartureLocal: string;
  /** Local arrival at final destination with day label, e.g. "11:40 JST (Day 2)". */
  finalArrivalLocal: string;
  outOfPocketCost: number;
  totalDelayHours: number;
  hardGatePassed: boolean;
  isRecommended: boolean;
  feasibilityScore: number;
  eligibilityStatus: 'QUALIFIED_RECOMMENDED' | 'QUALIFIED' | 'DISQUALIFIED_GATE_FAILED';
  gateBreaches: string[];
  /** All constraint check details (hard + soft). */
  constraintChecks: Array<{
    name: string;
    isHardGate: boolean;
    passed: boolean;
    severity: 'PASS' | 'WARNING' | 'FATAL_BREACH';
    detail: string;
  }>;
  assumptions: Array<{
    id: string;
    /**
     * ASSUMPTION = model estimate, reasonable but unverified.
     * UNVERIFIED_DATA = explicitly flagged as not confirmed from authoritative source.
     * SYNTHETIC_FALLBACK = fixture / simulation placeholder.
     */
    category: 'ASSUMPTION' | 'UNVERIFIED_DATA' | 'SYNTHETIC_FALLBACK';
    title: string;
    detail: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    verificationAction: string;
  }>;
  nextSteps: Array<{
    stepNumber: number;
    location: string;
    action: string;
    mandatory: boolean;
  }>;
}

/** Complete view-model emitted by the engine for one evaluation run. */
export interface RecoveryViewModel {
  /** UTC instant the inbound aircraft touched down (ISO 8601). */
  touchdownUtc: string;
  /** Local label for display, e.g. "13:30 CET". */
  touchdownLocal: string;
  /** UTC instant of the originally scheduled touchdown. */
  scheduledTouchdownUtc: string;
  /** Delay applied to reach actual touchdown, in minutes. */
  appliedDelayMinutes: number;
  /** UTC departure of the missed original onward flight. */
  missedFlightDepartureUtc: string;
  /** Local label for the missed flight departure, e.g. "13:45 CET". */
  missedFlightDepartureLocal: string;
  /** Airport minimum connection time used for this evaluation, in minutes. */
  mctMinutes: number;
  /** Minutes of margin above (+) or below (-) MCT after applying the delay. */
  connectionMarginMinutes: number;
  /** High-level status of the original connection. */
  connectionStatus: ConnectionStatus;
  /** Human-readable one-line status for the calm banner. */
  connectionStatusHeadline: string;
  /** Two-sentence explanation for the Recovery screen top. */
  connectionStatusExplanation: string;
  /** Evaluated recovery candidates in display order. */
  options: EvaluatedOption[];
  /** Which provider/mode produced the raw options. */
  providerMode: ProviderMode;
  /** ISO 8601 timestamp when this view-model was produced. */
  evaluatedAt: string;
}

