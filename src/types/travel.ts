/**
 * RouteX Core Travel & Disruption Recovery Data Models
 * Designed for Autonomous Travel Planning & Disruption Recovery.
 */

export interface ItinerarySegment {
  id: string;
  type: 'flight' | 'train' | 'hotel' | 'meeting' | 'activity';
  code: string; // e.g., "LH 901", "LH 714", "ICE 623"
  title: string;
  carrier: string;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string; // e.g. "09:30"
  departureTimeZone: string; // e.g. "GMT (UTC+0)"
  arrivalTime: string;   // e.g. "12:15"
  arrivalTimeZone: string; // e.g. "CET (UTC+1)"
  duration: string; // e.g. "1h 45m"
  dayNumber: number;
  terminalGate?: string;
  status: 'completed' | 'delayed' | 'missed' | 'cancelled' | 'scheduled' | 'recovered';
  notes?: string;
}

export interface HardConstraintGate {
  id: string;
  name: string;
  requirement: string;
  isHardRequirement: true; // Cannot be violated under any circumstances
}

export interface SoftPreference {
  id: string;
  name: string;
  preference: string;
  isHardRequirement: false; // Weighted optimization goal
}

export interface TripConstraints {
  // Hard Requirements (Pass / Fail Gates)
  maxRecoveryBudget: number; // in USD
  budgetCurrency: string;
  hardArrivalDeadline: string; // "Day 2, 14:00 JST"
  hardArrivalDeadlineNumber: number; // Day 2 14.0 in decimal hours for deterministic comparison
  visaTransitStatus: string; // "Airside Schengen Transit Only (No German Border Entry Permit)"
  allowsLandsideBorderEntry: boolean; // false
  
  // Soft Preferences
  alliancePreference: string; // "Star Alliance (Lufthansa / ANA priority)"
  preferredTravelClass: string; // "Economy / Economy-Flex"
  baggageTag: string; // "LH-982341 (Checked through to Tokyo HND)"
}

export interface Trip {
  id: string;
  title: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerName: string;
  travelerTier: string;
  status: 'on_schedule' | 'disrupted' | 'recovery_proposed' | 'recovered';
  constraints: TripConstraints;
  itinerary: ItinerarySegment[];
}

export interface DisruptionEvent {
  id: string;
  type: 'MISSED_CONNECTION';
  detectedAt: string; // "2027-03-10T13:30:00+01:00"
  location: string;   // "Frankfurt Airport (FRA) - Terminal 1 Concourse A"
  timeZone: string;   // "CET (UTC+1)"
  delayedSegmentId: string;
  missedSegmentId: string;
  delayMinutes: number;
  missedMarginMinutes: number;
  rootCause: string;
  isSyntheticSimulation: true;
  syntheticNotice: string;
}

export interface ConstraintCheckResult {
  name: string;
  isHardGate: boolean;
  passed: boolean;
  detail: string;
  severity: 'PASS' | 'WARNING' | 'FATAL_BREACH';
}

export interface AssumptionOrUnverifiedItem {
  id: string;
  category: 'ASSUMPTION' | 'UNVERIFIED_DATA' | 'SYNTHETIC_FALLBACK';
  title: string;
  detail: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  verificationAction: string;
}

export interface OperationalNextStep {
  stepNumber: number;
  location: string;
  action: string;
  mandatory: boolean;
}

export interface RecoveryOption {
  id: string;
  title: string;
  subtitle: string;
  recoveryMode: 'DIRECT_REBOOK' | 'MULTIMODAL_RAIL_AIR' | 'OVERNIGHT_REST';
  carrierSummary: string;
  newSegments: ItinerarySegment[];
  estimatedTotalCost: number;
  airlineCoveredAmount: number;
  outOfPocketCost: number;
  finalArrivalTime: string; // e.g. "Day 2, 11:40 JST"
  totalDelayHours: number;
  
  // Hard Constraint Gate Evaluation (Gates, not weighted scores)
  hardGatePassed: boolean;
  gateBreaches: string[];
  
  // Scoring only applies if all hard gates are passed
  feasibilityScore: number; // 0 if gate failed; 0-100 if passed
  eligibilityStatus: 'QUALIFIED_RECOMMENDED' | 'DISQUALIFIED_GATE_FAILED';
  
  constraintChecks: ConstraintCheckResult[];
  assumptions: AssumptionOrUnverifiedItem[];
  nextSteps: OperationalNextStep[];
  tradeOffSummary: string;
  isRecommended: boolean;
}

export interface ApprovalRecord {
  optionId: string;
  optionTitle: string;
  approvedAt: string;
  travelerName: string;
  costDelta: number;
  timeDeltaHours: number;
  acknowledgedAssumptionsCount: number;
}
