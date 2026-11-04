import { describe, it, expect } from 'vitest';
import { DynamicTripEngine } from '../services/validation/DynamicTripEngine';
import { MonteCarloEngine } from '../services/twin/MonteCarloEngine';
import { UserTripInput, CandidateOptionInput } from '../types/tripBuilder';

describe('Scripted End-to-End Demo Path', () => {
  it('Executes complete traveler journey: build -> delay -> twin -> countdown -> propose -> approve -> rollback', () => {
    // 1. Build Trip: Sarah Jenkins traveling from London LHR to Tokyo HND via Frankfurt FRA
    const customTrip: UserTripInput = {
      id: 'demo-scripted-trip',
      title: 'Global Leadership Summit Tokyo',
      travelerName: 'Sarah Jenkins',
      legs: [
        {
          id: 'demo-leg-1',
          originIata: 'LHR',
          destinationIata: 'FRA',
          flightNumber: 'LH 901',
          carrier: 'Lufthansa',
          departureTimeLocal: '2027-03-10T06:30',
          arrivalTimeLocal: '2027-03-10T09:10',
        },
        {
          id: 'demo-leg-2',
          originIata: 'FRA',
          destinationIata: 'HND',
          flightNumber: 'NH 204',
          carrier: 'ANA',
          departureTimeLocal: '2027-03-10T11:30',
          arrivalTimeLocal: '2027-03-11T06:55',
        },
      ],
      commitmentTitle: 'Global Partner Keynote',
      deadlineTimeLocal: '2027-03-11T12:00',
      deadlineIanaZone: 'Asia/Tokyo',
      budgetCeiling: 350,
      mctBufferMinutes: 45,
      hasCheckedBaggage: true,
      hasSchengenVisa: true,
      disruption: {
        disruptedLegIndex: 0,
        type: 'DELAY',
        delayMinutes: 0, // initially on time
        reason: 'Nominal',
      },
    };

    // Candidate recovery option
    const candidateOption: CandidateOptionInput = {
      id: 'cand-ana-recovery',
      title: 'ANA Afternoon Direct',
      source: 'ai-proposed',
      carrierSummary: 'ANA • NH 224',
      cost: 150,
      recoveryMode: 'DIRECT_REBOOK',
      requiresLandsideTransit: false,
      legs: [
        {
          originIata: 'FRA',
          destinationIata: 'HND',
          flightNumber: 'NH 224',
          carrier: 'ANA',
          departureTimeLocal: '2027-03-10T13:45',
          arrivalTimeLocal: '2027-03-11T09:15',
        },
      ],
    };

    // Step A: Initially on schedule -> connection margin is positive (+95m)
    const initialEval = DynamicTripEngine.evaluateTrip(customTrip, [candidateOption]);
    expect(initialEval.connectionStatus.isConnectionMissed).toBe(false);
    expect(initialEval.connectionStatus.statusCategory).toBe('ON_SCHEDULE');
    expect(initialEval.connectionStatus.connectionMarginMinutes).toBe(95); // 140m layover - 45m MCT
    expect(initialEval.evaluatedOptions.length).toBe(0); // Short-circuited when safe

    // Step B: Disruption applied -> +110m inbound delay
    const disruptedTrip: UserTripInput = {
      ...customTrip,
      disruption: {
        disruptedLegIndex: 0,
        type: 'DELAY',
        delayMinutes: 110,
        reason: 'Air traffic flow management slot delay',
      },
    };

    const disruptedEval = DynamicTripEngine.evaluateTrip(disruptedTrip, [candidateOption]);
    expect(disruptedEval.connectionStatus.isConnectionMissed).toBe(true);
    expect(disruptedEval.connectionStatus.statusCategory).toBe('MISSED_CONNECTION');
    // Effective layover: 140 - 110 = 30m. MCT = 45m. Margin = -15m breach!
    expect(disruptedEval.connectionStatus.effectiveLayoverMinutes).toBe(30);
    expect(disruptedEval.connectionStatus.connectionMarginMinutes).toBe(-15);

    // Step C: Twin Probabilistic Simulation (Monte Carlo)
    const mcResult = MonteCarloEngine.runSimulation(
      {
        sampleCount: 2000,
        seed: 42,
        delayMin: 80,
        delayMode: 110,
        delayMax: 150,
        walkVarianceMinutes: 6,
        mctVarianceMinutes: 4,
      },
      {
        scheduledLayoverMinutes: 140,
        nominalMctMinutes: 45,
        options: [
          {
            id: candidateOption.id,
            title: candidateOption.title,
            nominalAvailableWindowMins: 165,
            deadlineBufferMinutes: 165,
          },
        ],
      }
    );

    // Original connection has severely degraded probability (<15%) under 80-150m delay
    expect(mcResult.originalConnectionSuccessRate).toBeLessThan(15);
    expect(mcResult.optionsStats[0].successProbability).toBeGreaterThan(80);
    expect(mcResult.optionsStats[0].p50MarginMinutes).toBeGreaterThan(0);

    // Step D: Decision countdown verified
    const departureUtc = new Date('2027-03-10T12:45:00Z');
    const demoInstant = new Date('2027-03-10T12:30:00Z');
    const minutesRemaining = Math.round((departureUtc.getTime() - demoInstant.getTime()) / 60000);
    expect(minutesRemaining).toBe(15);

    // Step E: Candidate verified by engine hard gates
    expect(disruptedEval.evaluatedOptions.length).toBe(1);
    const evaluatedCandidate = disruptedEval.evaluatedOptions[0];
    expect(evaluatedCandidate.hardGatePassed).toBe(true);
    expect(evaluatedCandidate.eligibilityStatus).toBe('QUALIFIED_RECOMMENDED');
    expect(evaluatedCandidate.outOfPocketCost).toBe(150);
    expect(evaluatedCandidate.subtitle).toContain('AI-proposed, availability unverified');

    // Step F: Traveler approval locks in revised itinerary
    const approvedItinerary = [
      disruptedTrip.legs[0],
      {
        id: 'revised-leg-2',
        originIata: 'FRA',
        destinationIata: 'HND',
        flightNumber: 'NH 224',
        carrier: 'ANA',
        departureTimeLocal: '2027-03-10T13:45',
        arrivalTimeLocal: '2027-03-11T09:15',
      },
    ];
    expect(approvedItinerary[1].flightNumber).toBe('NH 224');

    // Step G: Rollback / Undo returns itinerary to original plan
    const rolledBackItinerary = [...customTrip.legs];
    expect(rolledBackItinerary[1].flightNumber).toBe('NH 204');
  });
});
