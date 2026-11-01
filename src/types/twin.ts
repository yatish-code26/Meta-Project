/**
 * RouteX Recovery Twin™ Simulation Types
 * Defines the parameters for the interactive what-if simulation sandbox.
 */

export interface TwinSimulationParams {
  delayMinutes: number;           // Inbound delay in minutes (e.g. 15 to 180)
  mctBufferMinutes: number;       // Airport Minimum Connection Time threshold (default: 45)
  budgetCeiling: number;          // Maximum out-of-pocket budget in USD (e.g. $0 to $1000)
  arrivalDeadlineHours: number;   // Hard arrival deadline (e.g. 14.0 for Day 2 14:00 JST)
  visaAirsideOnly: boolean;       // True = strictly airside non-Schengen; False = landside border permitted
}

export interface DisruptionCalculation {
  isConnectionMissed: boolean;
  scheduledLayoverMinutes: number;
  effectiveLayoverMinutes: number;
  connectionMarginMinutes: number; // Positive = safe buffer; Negative = missed by X mins
  statusCategory: 'ON_SCHEDULE' | 'TIGHT_BUFFER' | 'MISSED_CONNECTION';
  statusHeadline: string;
  statusExplanation: string;
}

export interface SyntheticPreset {
  id: string;
  name: string;
  destination: string;
  origin: string;
  defaultDelay: number;
  deadlineLabel: string;
  description: string;
}

