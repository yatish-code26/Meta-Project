import { describe, it, expect } from 'vitest';
import { DynamicTripEngine } from '../services/validation/DynamicTripEngine';
import { UserTripInput, CandidateOptionInput } from '../types/tripBuilder';

describe('DynamicTripEngine - Input-Driven Validation & Gates', () => {
  const baseTrip: UserTripInput = {
    id: 'trip-dynamic-test',
    title: 'London to Tokyo Business',
    travelerName: 'Sarah Jenkins',
    legs: [
      {
        id: 'leg-1',
        originIata: 'LHR',
        destinationIata: 'FRA',
        flightNumber: 'LH 901',
        carrier: 'Lufthansa',
        departureTimeLocal: '2026-11-15T06:30',
        arrivalTimeLocal: '2026-11-15T09:10', // 1h40 flight, LHR is UTC+0, FRA is UTC+1
      },
      {
        id: 'leg-2',
        originIata: 'FRA',
        destinationIata: 'HND',
        flightNumber: 'NH 204',
        carrier: 'ANA',
        departureTimeLocal: '2026-11-15T11:30', // Scheduled layover: 09:10 to 11:30 = 140 min
        arrivalTimeLocal: '2026-11-16T06:55',
      },
    ],
    commitmentTitle: 'Global Partner Keynote',
    deadlineTimeLocal: '2026-11-16T12:00',
    deadlineIanaZone: 'Asia/Tokyo',
    budgetCeiling: 300,
    mctBufferMinutes: 60,
    hasCheckedBaggage: true,
    hasSchengenVisa: true,
    disruption: {
      disruptedLegIndex: 0,
      type: 'DELAY',
      delayMinutes: 0,
      reason: 'None',
    },
  };

  const sampleCandidate: CandidateOptionInput = {
    id: 'cand-ana-alt',
    title: 'ANA Direct Alternative',
    source: 'ai-proposed',
    carrierSummary: 'ANA • Flight NH 224',
    cost: 150,
    legs: [
      {
        originIata: 'FRA',
        destinationIata: 'HND',
        flightNumber: 'NH 224',
        carrier: 'ANA',
        departureTimeLocal: '2026-11-15T13:45',
        arrivalTimeLocal: '2026-11-16T09:15',
      },
    ],
    recoveryMode: 'DIRECT_REBOOK',
    requiresLandsideTransit: false,
  };

  it('1. Input legs with normal connection computes scheduled layover and status ON_SCHEDULE', () => {
    const result = DynamicTripEngine.evaluateTrip(baseTrip, [sampleCandidate]);
    expect(result.connectionStatus.isConnectionMissed).toBe(false);
    expect(result.connectionStatus.statusCategory).toBe('ON_SCHEDULE');
    expect(result.connectionStatus.scheduledLayoverMinutes).toBe(140);
    expect(result.connectionStatus.connectionMarginMinutes).toBe(80); // 140 - 60 MCT = 80
    // Connection intact -> candidate options are short-circuited (empty)
    expect(result.evaluatedOptions.length).toBe(0);
  });

  it('2. Inbound delay +90m evaluates connection breach and MCT gate failure', () => {
    const delayedTrip: UserTripInput = {
      ...baseTrip,
      disruption: {
        disruptedLegIndex: 0,
        type: 'DELAY',
        delayMinutes: 90,
        reason: 'Ground equipment maintenance',
      },
    };

    const result = DynamicTripEngine.evaluateTrip(delayedTrip, [sampleCandidate]);
    expect(result.connectionStatus.isConnectionMissed).toBe(true);
    expect(result.connectionStatus.statusCategory).toBe('MISSED_CONNECTION');
    // Effective layover: 140 - 90 = 50 min. Required MCT = 60 min. Margin = -10 min.
    expect(result.connectionStatus.effectiveLayoverMinutes).toBe(50);
    expect(result.connectionStatus.connectionMarginMinutes).toBe(-10);

    // Candidate should now be evaluated
    expect(result.evaluatedOptions.length).toBe(1);
    const cand = result.evaluatedOptions[0];
    expect(cand.hardGatePassed).toBe(true);
    expect(cand.eligibilityStatus).toBe('QUALIFIED_RECOMMENDED');
  });

  it('3. Leg cancellation evaluates CANCELLED status with 0m effective layover', () => {
    const cancelledTrip: UserTripInput = {
      ...baseTrip,
      disruption: {
        disruptedLegIndex: 0,
        type: 'CANCELLATION',
        delayMinutes: 0,
        reason: 'Air Traffic Control Strike',
      },
    };

    const result = DynamicTripEngine.evaluateTrip(cancelledTrip, [sampleCandidate]);
    expect(result.connectionStatus.isConnectionMissed).toBe(true);
    expect(result.connectionStatus.isLegCancelled).toBe(true);
    expect(result.connectionStatus.statusCategory).toBe('CANCELLED');
    expect(result.connectionStatus.effectiveLayoverMinutes).toBe(0);
  });

  it('4. DST transition correctly calculates UTC conversion between GMT (UTC+0) and CET (UTC+1)', () => {
    // London LHR to Frankfurt FRA on winter date: LHR is Europe/London (UTC+0), FRA is Europe/Berlin (UTC+1)
    const winterTrip: UserTripInput = {
      ...baseTrip,
      legs: [
        {
          id: 'w-1',
          originIata: 'LHR',
          destinationIata: 'FRA',
          flightNumber: 'BA 902',
          carrier: 'British Airways',
          departureTimeLocal: '2026-01-10T08:00', // UTC 08:00
          arrivalTimeLocal: '2026-01-10T10:35',   // CET = UTC 09:35
        },
      ],
    };

    const result = DynamicTripEngine.evaluateTrip(winterTrip, []);
    const leg1 = result.legsUtc[0];
    expect(leg1.departureUtc.toISOString()).toBe('2026-01-10T08:00:00.000Z');
    expect(leg1.arrivalUtc.toISOString()).toBe('2026-01-10T09:35:00.000Z');
    // Flight duration: 1 hour 35 minutes
    const durMins = (leg1.arrivalUtc.getTime() - leg1.departureUtc.getTime()) / 60000;
    expect(durMins).toBe(95);
  });

  it('5. DST transition correctly calculates US Eastern to Central timezones', () => {
    // JFK (America/New_York) to ORD (America/Chicago) in July (EDT UTC-4 to CDT UTC-5)
    const summerUsTrip: UserTripInput = {
      ...baseTrip,
      legs: [
        {
          id: 'us-1',
          originIata: 'JFK',
          destinationIata: 'ORD',
          flightNumber: 'AA 100',
          carrier: 'American Airlines',
          departureTimeLocal: '2026-07-15T14:00', // EDT UTC-4 => UTC 18:00
          arrivalTimeLocal: '2026-07-15T15:45',   // CDT UTC-5 => UTC 20:45
        },
      ],
    };

    const result = DynamicTripEngine.evaluateTrip(summerUsTrip, []);
    const leg = result.legsUtc[0];
    expect(leg.departureUtc.toISOString()).toBe('2026-07-15T18:00:00.000Z');
    expect(leg.arrivalUtc.toISOString()).toBe('2026-07-15T20:45:00.000Z');
    const durMins = (leg.arrivalUtc.getTime() - leg.departureUtc.getTime()) / 60000;
    expect(durMins).toBe(165); // 2h45m flight
  });

  it('6. Deadline gate: Candidate arriving after commitment fails FATAL_BREACH', () => {
    const lateCandidate: CandidateOptionInput = {
      id: 'late-cand',
      title: 'Late Evening Flight',
      source: 'ai-proposed',
      carrierSummary: 'Lufthansa • LH 716',
      cost: 100,
      legs: [
        {
          originIata: 'FRA',
          destinationIata: 'HND',
          flightNumber: 'LH 716',
          carrier: 'Lufthansa',
          departureTimeLocal: '2026-11-15T18:00',
          arrivalTimeLocal: '2026-11-16T13:30', // Deadline is 12:00
        },
      ],
      recoveryMode: 'DIRECT_REBOOK',
    };

    const delayedTrip: UserTripInput = {
      ...baseTrip,
      disruption: { disruptedLegIndex: 0, type: 'DELAY', delayMinutes: 90, reason: 'De-icing' },
    };

    const result = DynamicTripEngine.evaluateTrip(delayedTrip, [lateCandidate]);
    const option = result.evaluatedOptions[0];
    expect(option.hardGatePassed).toBe(false);
    expect(option.eligibilityStatus).toBe('DISQUALIFIED_GATE_FAILED');
    expect(option.gateBreaches.some((b) => b.includes('Deadline Breach'))).toBe(true);
  });

  it('7. Budget gate: Candidate with cost > budgetCeiling fails FATAL_BREACH', () => {
    const expensiveCandidate: CandidateOptionInput = {
      id: 'exp-cand',
      title: 'First Class Rebook',
      source: 'user-entered',
      carrierSummary: 'Swiss • First Class',
      cost: 950, // Budget ceiling is 300
      legs: [
        {
          originIata: 'FRA',
          destinationIata: 'HND',
          flightNumber: 'LX 160',
          carrier: 'Swiss',
          departureTimeLocal: '2026-11-15T14:00',
          arrivalTimeLocal: '2026-11-16T08:30',
        },
      ],
      recoveryMode: 'DIRECT_REBOOK',
    };

    const delayedTrip: UserTripInput = {
      ...baseTrip,
      disruption: { disruptedLegIndex: 0, type: 'DELAY', delayMinutes: 90, reason: 'De-icing' },
    };

    const result = DynamicTripEngine.evaluateTrip(delayedTrip, [expensiveCandidate]);
    const option = result.evaluatedOptions[0];
    expect(option.hardGatePassed).toBe(false);
    expect(option.gateBreaches.some((b) => b.includes('Budget Breach'))).toBe(true);
  });

  it('8. Schengen gate: Multimodal landside transit fails when hasSchengenVisa is false', () => {
    const multimodalCandidate: CandidateOptionInput = {
      id: 'multi-cand',
      title: 'ICE Rail to Munich + LH 714',
      source: 'ai-proposed',
      carrierSummary: 'Deutsche Bahn ICE + Lufthansa',
      cost: 180,
      recoveryMode: 'MULTIMODAL_RAIL_AIR',
      requiresLandsideTransit: true, // Requires entering Schengen zone
      legs: [
        {
          originIata: 'FRA',
          destinationIata: 'MUC',
          flightNumber: 'ICE 523',
          carrier: 'Deutsche Bahn',
          departureTimeLocal: '2026-11-15T12:00', // 10:40 actual arrival + 80m > 60m MCT
          arrivalTimeLocal: '2026-11-15T15:15',
        },
        {
          originIata: 'MUC',
          destinationIata: 'HND',
          flightNumber: 'LH 714',
          carrier: 'Lufthansa',
          departureTimeLocal: '2026-11-15T17:00',
          arrivalTimeLocal: '2026-11-16T11:40',
        },
      ],
    };

    const noVisaTrip: UserTripInput = {
      ...baseTrip,
      hasSchengenVisa: false,
      disruption: { disruptedLegIndex: 0, type: 'DELAY', delayMinutes: 90, reason: 'De-icing' },
    };

    const result = DynamicTripEngine.evaluateTrip(noVisaTrip, [multimodalCandidate]);
    const option = result.evaluatedOptions[0];
    expect(option.hardGatePassed).toBe(false);
    expect(option.gateBreaches.some((b) => b.includes('Immigration Barrier'))).toBe(true);
  });

  it('9. Schengen gate: Multimodal landside transit passes when hasSchengenVisa is true', () => {
    const multimodalCandidate: CandidateOptionInput = {
      id: 'multi-cand-pass',
      title: 'ICE Rail to Munich + LH 714',
      source: 'ai-proposed',
      carrierSummary: 'Deutsche Bahn ICE + Lufthansa',
      cost: 180,
      recoveryMode: 'MULTIMODAL_RAIL_AIR',
      requiresLandsideTransit: true,
      legs: [
        {
          originIata: 'FRA',
          destinationIata: 'MUC',
          flightNumber: 'ICE 523',
          carrier: 'Deutsche Bahn',
          departureTimeLocal: '2026-11-15T12:00',
          arrivalTimeLocal: '2026-11-15T15:15',
        },
        {
          originIata: 'MUC',
          destinationIata: 'HND',
          flightNumber: 'LH 714',
          carrier: 'Lufthansa',
          departureTimeLocal: '2026-11-15T17:00',
          arrivalTimeLocal: '2026-11-16T11:40',
        },
      ],
    };

    const withVisaTrip: UserTripInput = {
      ...baseTrip,
      hasSchengenVisa: true,
      disruption: { disruptedLegIndex: 0, type: 'DELAY', delayMinutes: 90, reason: 'De-icing' },
    };

    const result = DynamicTripEngine.evaluateTrip(withVisaTrip, [multimodalCandidate]);
    const option = result.evaluatedOptions[0];
    expect(option.hardGatePassed).toBe(true);
    expect(option.eligibilityStatus).toBe('QUALIFIED_RECOMMENDED');
  });

  it('10. Extreme delay (+240m) causes candidate connection MCT breach', () => {
    const candidateDepartingSoon: CandidateOptionInput = {
      id: 'tight-cand',
      title: 'Quick Connect',
      source: 'user-entered',
      carrierSummary: 'JAL • JL 408',
      cost: 200,
      legs: [
        {
          originIata: 'FRA',
          destinationIata: 'HND',
          flightNumber: 'JL 408',
          carrier: 'Japan Airlines',
          departureTimeLocal: '2026-11-15T12:00', // With +240m delay, inbound touches down at 13:10!
          arrivalTimeLocal: '2026-11-16T07:15',
        },
      ],
      recoveryMode: 'DIRECT_REBOOK',
    };

    const extremeDelayTrip: UserTripInput = {
      ...baseTrip,
      disruption: { disruptedLegIndex: 0, type: 'DELAY', delayMinutes: 240, reason: 'Engine failure' },
    };

    const result = DynamicTripEngine.evaluateTrip(extremeDelayTrip, [candidateDepartingSoon]);
    const option = result.evaluatedOptions[0];
    expect(option.hardGatePassed).toBe(false);
    expect(option.gateBreaches.some((b) => b.includes('Physical Impossibility'))).toBe(true);
  });

  it('11. Distinguishes user-entered vs AI-proposed sources in subtitle and assumptions', () => {
    const userOption: CandidateOptionInput = {
      id: 'opt-user',
      title: 'Traveler Choice',
      source: 'user-entered',
      carrierSummary: 'Emirates via DXB',
      cost: 250,
      legs: [
        {
          originIata: 'FRA',
          destinationIata: 'HND',
          flightNumber: 'EK 046',
          carrier: 'Emirates',
          departureTimeLocal: '2026-11-15T15:00',
          arrivalTimeLocal: '2026-11-16T11:00',
        },
      ],
      recoveryMode: 'DIRECT_REBOOK',
    };

    const aiOption: CandidateOptionInput = {
      ...userOption,
      id: 'opt-ai',
      source: 'ai-proposed',
      title: 'Llama Suggested Rebook',
    };

    const delayedTrip: UserTripInput = {
      ...baseTrip,
      disruption: { disruptedLegIndex: 0, type: 'DELAY', delayMinutes: 90, reason: 'Congestion' },
    };

    const result = DynamicTripEngine.evaluateTrip(delayedTrip, [userOption, aiOption]);
    const evaluatedUser = result.evaluatedOptions.find((o) => o.id === 'opt-user');
    const evaluatedAi = result.evaluatedOptions.find((o) => o.id === 'opt-ai');

    expect(evaluatedUser?.subtitle).toContain('[user-entered]');
    expect(evaluatedAi?.subtitle).toContain('[AI-proposed, availability unverified]');
    expect(evaluatedAi?.assumptions[0].category).toBe('UNVERIFIED_DATA');
  });

  it('12. Single leg direct flight evaluates properly without hub connection breach', () => {
    const directTrip: UserTripInput = {
      ...baseTrip,
      legs: [
        {
          id: 'dir-1',
          originIata: 'LHR',
          destinationIata: 'JFK',
          flightNumber: 'BA 178',
          carrier: 'British Airways',
          departureTimeLocal: '2026-11-15T10:00',
          arrivalTimeLocal: '2026-11-15T13:00',
        },
      ],
      disruption: { disruptedLegIndex: 0, type: 'DELAY', delayMinutes: 30, reason: 'Headwinds' },
    };

    const result = DynamicTripEngine.evaluateTrip(directTrip, []);
    expect(result.connectionStatus.isConnectionMissed).toBe(false);
    expect(result.connectionStatus.scheduledLayoverMinutes).toBe(0);
    expect(result.evaluatedOptions.length).toBe(0);
  });
});
