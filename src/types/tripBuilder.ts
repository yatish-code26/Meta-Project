import { Airport } from '../data/airports';

export interface TripLegInput {
  id: string;
  originIata: string;
  destinationIata: string;
  flightNumber: string;
  carrier: string;
  departureTimeLocal: string; // "YYYY-MM-DDTHH:mm"
  arrivalTimeLocal: string;   // "YYYY-MM-DDTHH:mm"
}

export interface UserTripInput {
  id: string;
  title: string;
  travelerName: string;
  legs: TripLegInput[];
  // Commitment / Deadline
  commitmentTitle: string;
  deadlineTimeLocal: string; // "YYYY-MM-DDTHH:mm"
  deadlineIanaZone: string;  // e.g. "Asia/Tokyo"
  // Constraints
  budgetCeiling: number;     // USD
  mctBufferMinutes: number;  // Editable MCT
  hasCheckedBaggage: boolean;
  hasSchengenVisa: boolean;  // false = strictly airside non-Schengen transit
  // Disruption
  disruption: {
    disruptedLegIndex: number;
    type: 'DELAY' | 'CANCELLATION';
    delayMinutes: number;
    reason: string;
  };
}

export interface CandidateOptionInput {
  id: string;
  title: string;
  source: 'user-entered' | 'ai-proposed';
  carrierSummary: string;
  cost: number;              // Out of pocket in USD
  legs: Array<{
    originIata: string;
    destinationIata: string;
    flightNumber: string;
    carrier: string;
    departureTimeLocal: string;
    arrivalTimeLocal: string;
  }>;
  recoveryMode: 'DIRECT_REBOOK' | 'MULTIMODAL_RAIL_AIR' | 'OVERNIGHT_REST';
  requiresLandsideTransit?: boolean;
}

