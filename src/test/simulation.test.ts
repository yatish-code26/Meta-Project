import { describe, it, expect } from 'vitest';
import { DeterministicConstraintEngine } from '../services/validation/DeterministicConstraintEngine';
import { INITIAL_TRIP_DATA, SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';
import { MetaRecoveryTestFixture } from '../services/meta/MetaRecoveryTestFixture';
import { ALL_PRESETS, getPresetById } from '../data/syntheticTrips';

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
    // When visaAirsideOnly is true, Option B fails immigration gate
    const strictEval = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      {
        delayMinutes: 75,
        mctBufferMinutes: 45,
        budgetCeiling: 450,
        arrivalDeadlineHours: 14.0,
        visaAirsideOnly: true,
      }
    );
    const optBStrict = strictEval.find((o) => o.id === 'OPT-RECOVER-B')!;
    expect(optBStrict.gateBreaches.some((b) => b.includes('Immigration Barrier'))).toBe(true);

    // When visaAirsideOnly is relaxed to false (e.g. traveler holds German visa)
    const relaxedEval = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      {
        delayMinutes: 75,
        mctBufferMinutes: 45,
        budgetCeiling: 450,
        arrivalDeadlineHours: 14.0,
        visaAirsideOnly: false,
      }
    );
    const optBRelaxed = relaxedEval.find((o) => o.id === 'OPT-RECOVER-B')!;
    const visaCheck = optBRelaxed.constraintChecks.find((c) =>
      c.name.includes('Immigration & Transit Visa')
    );
    expect(visaCheck?.passed).toBe(true);
  });

  it('3. What-If: Tightening budget ceiling disqualifies paid recovery options', () => {
    // With $0 budget ceiling, any option with outOfPocketCost > 0 is disqualified
    const zeroBudgetEval = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      {
        delayMinutes: 75,
        mctBufferMinutes: 45,
        budgetCeiling: 0,
        arrivalDeadlineHours: 14.0,
        visaAirsideOnly: true,
      }
    );

    const optA = zeroBudgetEval.find((o) => o.id === 'OPT-RECOVER-A')!;
    expect(optA.outOfPocketCost).toBe(0);
    expect(optA.hardGatePassed).toBe(true); // Option A is $0 under EU261

    const optB = zeroBudgetEval.find((o) => o.id === 'OPT-RECOVER-B')!;
    expect(optB.hardGatePassed).toBe(false);
    expect(optB.gateBreaches.some((b) => b.includes('exceeds approved $0'))).toBe(true);
  });

  it('4. What-If: Extending deadline to 18:00 hours evaluates Option B timing', () => {
    // With 18.0 deadline (Day 2 18:00 JST), Option B (lands 16:05 JST) clears arrival deadline gate
    const extendedDeadlineEval = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      {
        delayMinutes: 75,
        mctBufferMinutes: 45,
        budgetCeiling: 450,
        arrivalDeadlineHours: 18.0,
        visaAirsideOnly: false, // relax visa as well
      }
    );

    const optB = extendedDeadlineEval.find((o) => o.id === 'OPT-RECOVER-B')!;
    const deadlineCheck = optB.constraintChecks.find((c) => c.name.includes('Arrival Deadline'));
    expect(deadlineCheck?.passed).toBe(true);
  });

  it('5. Physical Feasibility: Extreme inbound delay (+180m) violates candidate departure window', () => {
    // Severe delay pushes arrival past candidate departure
    const extremeDelayEval = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      {
        delayMinutes: 180, // Touchdown at 15:15 CET, but LH 714 departs at 14:55 CET
        mctBufferMinutes: 45,
        budgetCeiling: 450,
        arrivalDeadlineHours: 14.0,
        visaAirsideOnly: true,
      }
    );

    const optA = extremeDelayEval.find((o) => o.id === 'OPT-RECOVER-A')!;
    expect(optA.hardGatePassed).toBe(false);
    expect(optA.gateBreaches.some((b) => b.includes('Minimum Connection Time'))).toBe(true);
    expect(optA.feasibilityScore).toBe(0);
    expect(optA.isRecommended).toBe(false);
  });
});

