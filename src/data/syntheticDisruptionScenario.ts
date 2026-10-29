import { Trip, DisruptionEvent } from '../types/travel';

/**
 * High-fidelity synthetic travel scenario clearly labelled.
 * Verified for mathematical, chronological, and time zone internal consistency.
 * 
 * TIME ZONES:
 * - London (LHR): GMT (UTC+0)
 * - Frankfurt (FRA): CET (UTC+1) — [+1h vs London]
 * - Tokyo (HND): JST (UTC+9) — [+8h vs Frankfurt, +9h vs London]
 */

export const INITIAL_TRIP_DATA: Trip = {
  id: 'TRIP-TOKYO-2026',
  title: 'Global Tech Symposium & Tokyo Site Inspection',
  origin: 'London Heathrow (LHR)',
  destination: 'Tokyo Haneda (HND)',
  startDate: '2026-10-28',
  endDate: '2026-11-04',
  travelerName: 'Alex Turner',
  travelerTier: 'Star Alliance Gold (Senator)',
  status: 'disrupted',
  constraints: {
    maxRecoveryBudget: 450,
    budgetCurrency: 'USD',
    hardArrivalDeadline: 'Day 2, 14:00 JST (Symposium Opening Doors)',
    hardArrivalDeadlineNumber: 14.0, // Day 2 14:00 decimal
    visaTransitStatus: 'Airside Schengen Transit Only (No German Border Entry Permit)',
    allowsLandsideBorderEntry: false,
    alliancePreference: 'Star Alliance (Lufthansa / ANA priority)',
    preferredTravelClass: 'Economy / Economy-Flex',
    baggageTag: 'LH-982341 (Checked through to Tokyo HND)',
  },
  itinerary: [
    {
      id: 'seg-1',
      type: 'flight',
      code: 'LH 901',
      title: 'Flight LHR → FRA (London Heathrow to Frankfurt)',
      carrier: 'Lufthansa',
      departureLocation: 'London Heathrow (LHR) - Terminal 2',
      arrivalLocation: 'Frankfurt Airport (FRA) - Terminal 1',
      departureTime: '09:30',
      departureTimeZone: 'GMT (UTC+0)',
      arrivalTime: '13:30', // Actual touchdown with delay (scheduled 12:15 CET)
      arrivalTimeZone: 'CET (UTC+1)',
      duration: '1h 45m flight (+75m delay)',
      dayNumber: 1,
      terminalGate: 'Gate A14',
      status: 'delayed',
      notes: 'Departed London 45m late; European airspace ATC slot restriction added 30m.',
    },
    {
      id: 'seg-2',
      type: 'flight',
      code: 'LH 716',
      title: 'Connecting Flight FRA → HND (Frankfurt to Tokyo Haneda)',
      carrier: 'Lufthansa',
      departureLocation: 'Frankfurt Airport (FRA) - Terminal 1',
      arrivalLocation: 'Tokyo Haneda (HND) - Terminal 3',
      departureTime: '13:45',
      departureTimeZone: 'CET (UTC+1)',
      arrivalTime: '10:50 (Day 2)',
      arrivalTimeZone: 'JST (UTC+9)',
      duration: '13h 05m',
      dayNumber: 1,
      terminalGate: 'Gate B24',
      status: 'missed',
      notes: 'Boarding closed at 13:25 CET. Inbound arrival was 13:30 CET; 45m MCT exceeded. Connection missed.',
    },
    {
      id: 'seg-3',
      type: 'hotel',
      code: 'HTL-CAPITOL',
      title: 'Check-in: The Capitol Hotel Tokyu',
      carrier: 'The Capitol Hotel',
      departureLocation: 'Tokyo Haneda Airport',
      arrivalLocation: 'Chiyoda-ku, Tokyo',
      departureTime: '12:00 (Day 2)',
      departureTimeZone: 'JST (UTC+9)',
      arrivalTime: '12:45 (Day 2)',
      arrivalTimeZone: 'JST (UTC+9)',
      duration: '45m transit',
      dayNumber: 2,
      status: 'scheduled',
      notes: 'Standard check-in window opens at 12:00 JST.',
    },
    {
      id: 'seg-4',
      type: 'meeting',
      code: 'MTG-KEYNOTE',
      title: 'CRITICAL: Global Tech Symposium Opening Keynote',
      carrier: 'Tokyo International Forum',
      departureLocation: 'The Capitol Hotel Tokyu',
      arrivalLocation: 'Tokyo International Forum, Hall A',
      departureTime: '14:00 (Day 2)',
      departureTimeZone: 'JST (UTC+9)',
      arrivalTime: '14:30 (Day 2)',
      arrivalTimeZone: 'JST (UTC+9)',
      duration: '30m transit / doors open',
      dayNumber: 2,
      status: 'scheduled',
      notes: 'MANDATORY COMMITMENT: Alex Turner delivers 14:30 JST opening remarks.',
    },
    {
      id: 'seg-5',
      type: 'activity',
      code: 'ACT-DINNER',
      title: 'Executive Welcome Dinner',
      carrier: 'Ginza Ukai-Tei',
      departureLocation: 'Tokyo International Forum',
      arrivalLocation: 'Ginza, Chuo City, Tokyo',
      departureTime: '19:00 (Day 2)',
      departureTimeZone: 'JST (UTC+9)',
      arrivalTime: '21:30 (Day 2)',
      arrivalTimeZone: 'JST (UTC+9)',
      duration: '2h 30m',
      dayNumber: 2,
      status: 'scheduled',
      notes: 'Reserved delegation dinner.',
    },
  ],
};

export const SYNTHETIC_DISRUPTION_EVENT: DisruptionEvent = {
  id: 'DISRUPT-FRA-716',
  type: 'MISSED_CONNECTION',
  detectedAt: '2026-10-28T13:30:00+01:00',
  location: 'Frankfurt Airport (FRA) - Terminal 1 Concourse A',
  timeZone: 'CET (UTC+1)',
  delayedSegmentId: 'seg-1',
  missedSegmentId: 'seg-2',
  delayMinutes: 75,
  missedMarginMinutes: 35, // Missed boarding gate cutoff by 35 mins (45m MCT)
  rootCause: 'Inbound flight LH 901 arrived at 13:30 CET (75m late). Connecting flight LH 716 gate closed at 13:25 CET with 13:45 CET departure. Minimum connection time (45m) could not be met.',
  isSyntheticSimulation: true,
  syntheticNotice: 'SYNTHETIC SCENARIO: Calibrated for realistic Frankfurt Hub airside transit times and Tokyo polar routing.',
};
