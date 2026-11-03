import { describe, it, expect } from 'vitest';
import { DeterministicConstraintEngine } from '../services/validation/DeterministicConstraintEngine';
import { INITIAL_TRIP_DATA, SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';
import { MetaRecoveryTestFixture } from '../services/meta/MetaRecoveryTestFixture';
import { ALL_PRESETS, getPresetById } from '../data/syntheticTrips';
import { TwinSimulationParams } from '../types/twin';

// Pinned UTC instants for the standard Tokyo scenario (winter, CET = UTC+1)
const SCHEDULED_TOUCHDOWN_UTC = new Date('2027-03-10T11:15:00Z'); // 12:15 CET
const ONWARD_DEPARTURE_UTC = new Date('2027-03-10T12:45:00Z');    // 13:45 CET

/** Helper: build standard ConnectionContext with a given delayMinutes. */
function makeCtx(delayMinutes: number) {
  return {
    scheduledTouchdownUtc: SCHEDULED_TOUCHDOWN_UTC,
    touchdownUtc: new Date(SCHEDULED_TOUCHDOWN_UTC.getTime() + delayMinutes * 60_000),
    onwardDepartureUtc: ONWARD_DEPARTURE_UTC,
  };
}

describe('RouteX Recovery Twin™ Simulation & What-If Dynamics', () => {
  const rawResponse = MetaRecoveryTestFixture.getMockResponse({
    trip: INITIAL_TRIP_DATA,
    disruption: SYNTHETIC_DISRUPTION_EVENT,
    constraints: INITIAL_TRIP_DATA.constraints,
    currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
    currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
  });

  it('1. Calibrated presets are properly configured with distinct destinations', () => {
    expect(ALL_PRESETS.length).toBe(3);
    const tokyo = getPresetById('tokyo-symposium');
    const nyc = getPresetById('ny-climate-summit');
    const london = getPresetById('london-tech-board');

    expect(tokyo.trip.destination).toContain('Tokyo');
    expect(nyc.trip.destination).toContain('New York');
    expect(london.trip.destination).toContain('London');
  });

  it('2. What-If: Relaxing visa requirement clears immigration gate for multimodal route', () => {
    const strictParams: TwinSimulationParams = {
      delayMinutes: 75, mctBufferMinutes: 45,
      budgetCeiling: 450, arrivalDeadlineHours: 14.0, visaAirsideOnly: true,
    };
    // When visaAirsideOnly is true, Option B fails immigration gate
    const strictResult = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions, INITIAL_TRIP_DATA, strictParams, makeCtx(75)
    );
    const optBStrict = strictResult.options.find((o) => o.id === 'OPT-RECOVER-B')!;
    expect(optBStrict.gateBreaches.some((b) => b.includes('Immigration Barrier'))).toBe(true);

    // When visaAirsideOnly is relaxed to false (e.g. traveler holds German visa)
    const relaxedParams: TwinSimulationParams = { ...strictParams, visaAirsideOnly: false };
    const relaxedResult = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions, INITIAL_TRIP_DATA, relaxedParams, makeCtx(75)
    );
    const optBRelaxed = relaxedResult.options.find((o) => o.id === 'OPT-RECOVER-B')!;
    const visaCheck = optBRelaxed.constraintChecks.find((c) =>
      c.name.includes('Immigration & Transit Visa')
    );
    expect(visaCheck?.passed).toBe(true);
  });

  it('3. What-If: Tightening budget ceiling disqualifies paid recovery options', () => {
    // With $0 budget ceiling, any option with outOfPocketCost > 0 is disqualified
    const zeroBudgetParams: TwinSimulationParams = {
      delayMinutes: 75, mctBufferMinutes: 45,
      budgetCeiling: 0, arrivalDeadlineHours: 14.0, visaAirsideOnly: true,
    };
    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions, INITIAL_TRIP_DATA, zeroBudgetParams, makeCtx(75)
    );

    const optA = result.options.find((o) => o.id === 'OPT-RECOVER-A')!;
    expect(optA.outOfPocketCost).toBe(0);
    expect(optA.hardGatePassed).toBe(true); // Option A is $0 under EU261 (unverified)

    const optB = result.options.find((o) => o.id === 'OPT-RECOVER-B')!;
    expect(optB.hardGatePassed).toBe(false);
    expect(optB.gateBreaches.some((b) => b.includes('exceeds approved $0'))).toBe(true);
  });

  it('4. What-If: Extending deadline to 18:00 hours evaluates Option B timing', () => {
    // With 18.0 deadline (Day 2 18:00 JST), Option B (lands 16:05 JST) clears arrival deadline gate
    const extendedParams: TwinSimulationParams = {
      delayMinutes: 75, mctBufferMinutes: 45,
      budgetCeiling: 450, arrivalDeadlineHours: 18.0, visaAirsideOnly: false,
    };
    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions, INITIAL_TRIP_DATA, extendedParams, makeCtx(75)
    );

    const optB = result.options.find((o) => o.id === 'OPT-RECOVER-B')!;
    const deadlineCheck = optB.constraintChecks.find((c) => c.name.includes('Arrival Deadline'));
    expect(deadlineCheck?.passed).toBe(true);
  });

  it('5. Physical Feasibility: Extreme inbound delay (+180m) violates candidate departure window', () => {
    // Severe delay pushes arrival past candidate departure
    // Touchdown = 12:15 + 180m = 15:15 CET; LH 714 departs 14:55 CET → window = -20m
    const extremeParams: TwinSimulationParams = {
      delayMinutes: 180, mctBufferMinutes: 45,
      budgetCeiling: 450, arrivalDeadlineHours: 14.0, visaAirsideOnly: true,
    };
    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions, INITIAL_TRIP_DATA, extremeParams, makeCtx(180)
    );

    const optA = result.options.find((o) => o.id === 'OPT-RECOVER-A')!;
    expect(optA.hardGatePassed).toBe(false);
    expect(optA.gateBreaches.some((b) => b.includes('Minimum Connection Time'))).toBe(true);
    expect(optA.feasibilityScore).toBe(0);
    expect(optA.isRecommended).toBe(false);
  });
});
