import { describe, it, expect } from 'vitest';
import { DeterministicConstraintEngine } from '../services/validation/DeterministicConstraintEngine';
import { INITIAL_TRIP_DATA, SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';
import { MetaRecoveryTestFixture } from '../services/meta/MetaRecoveryTestFixture';
import { TwinSimulationParams, RiskProfile } from '../types/twin';

// Pinned UTC instants for the standard Tokyo scenario
const SCHEDULED_TOUCHDOWN_UTC = new Date('2027-03-10T11:15:00Z'); // 12:15 CET
const ONWARD_DEPARTURE_UTC = new Date('2027-03-10T12:45:00Z');    // 13:45 CET

function makeCtx(delayMinutes: number) {
  return {
    scheduledTouchdownUtc: SCHEDULED_TOUCHDOWN_UTC,
    touchdownUtc: new Date(SCHEDULED_TOUCHDOWN_UTC.getTime() + delayMinutes * 60_000),
    onwardDepartureUtc: ONWARD_DEPARTURE_UTC,
    referenceDate: '2027-03-10',
    airportIanaZone: 'Europe/Berlin',
  };
}

describe('Feature F2: Twin Lab & Risk-Profile Simulation Engine', () => {
  const rawResponse = MetaRecoveryTestFixture.getMockResponse({
    trip: INITIAL_TRIP_DATA,
    disruption: SYNTHETIC_DISRUPTION_EVENT,
    constraints: INITIAL_TRIP_DATA.constraints,
    currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
    currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
  });

  const baseParams: TwinSimulationParams = {
    delayMinutes: 75,
    mctBufferMinutes: 45,
    budgetCeiling: 450,
    arrivalDeadlineHours: 18.0, // Open deadline so multiple options pass hard gate
    visaAirsideOnly: false,     // Open visa so multimodal option passes hard gate
    riskProfile: 'balanced',
  };

  it('1. Strict Operational Principle: Risk profile alters SOFT weights only and never makes an infeasible route feasible', () => {
    // Parameter where Option B violates budget ($280 cost > $100 ceiling)
    const tightBudgetParams: TwinSimulationParams = {
      ...baseParams,
      budgetCeiling: 100,
    };

    const profiles: RiskProfile[] = ['cautious', 'balanced', 'fastest'];
    for (const profile of profiles) {
      const result = DeterministicConstraintEngine.evaluateCandidates(
        rawResponse.rawOptions,
        INITIAL_TRIP_DATA,
        { ...tightBudgetParams, riskProfile: profile },
        makeCtx(75)
      );

      const optB = result.options.find((o) => o.id === 'OPT-RECOVER-B')!;
      expect(optB.hardGatePassed).toBe(false);
      expect(optB.feasibilityScore).toBe(0);
      expect(optB.isRecommended).toBe(false);
      expect(optB.gateBreaches.length).toBeGreaterThan(0);
    }
  });

  it('2. Cautious Profile: Prized connection buffers and penalizes tight transfers', () => {
    const cautiousResult = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      { ...baseParams, riskProfile: 'cautious' },
      makeCtx(75)
    );

    const fastestResult = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      { ...baseParams, riskProfile: 'fastest' },
      makeCtx(75)
    );

    // Option A has generous 110m connection margin and arrives with minimal 2.5h delay
    const optACautious = cautiousResult.options.find((o) => o.id === 'OPT-RECOVER-A')!;
    const optAFastest = fastestResult.options.find((o) => o.id === 'OPT-RECOVER-A')!;

    expect(optACautious.hardGatePassed).toBe(true);
    expect(optAFastest.hardGatePassed).toBe(true);
    expect(optACautious.feasibilityScore).toBeGreaterThanOrEqual(80);
  });

  it('3. Fastest Profile: Heavily penalizes total delay hours to prioritize earliest arrival', () => {
    const fastestResult = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      { ...baseParams, riskProfile: 'fastest' },
      makeCtx(75)
    );

    const optA = fastestResult.options.find((o) => o.id === 'OPT-RECOVER-A')!; // +2.5h delay
    const optB = fastestResult.options.find((o) => o.id === 'OPT-RECOVER-B')!; // +7.0h delay

    // Under 'fastest' weighting, Option A (+2.5h delay) scores substantially higher than Option B (+7h delay)
    expect(optA.feasibilityScore).toBeGreaterThan(optB.feasibilityScore);
  });

  it('4. ConnectionIntact Short-Circuit: Zero delay preserves connection without recovery candidates', () => {
    const zeroDelayParams: TwinSimulationParams = {
      ...baseParams,
      delayMinutes: 0,
    };

    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      zeroDelayParams,
      makeCtx(0)
    );

    expect(result.connectionIntact).toBe(true);
    expect(result.options.length).toBe(0);
  });

  it('5. Physical MCT Boundary: Severe delay (+180m) fails candidate first-leg departure', () => {
    const severeDelayParams: TwinSimulationParams = {
      ...baseParams,
      delayMinutes: 180,
    };

    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      INITIAL_TRIP_DATA,
      severeDelayParams,
      makeCtx(180)
    );

    // Inbound touches down at 15:15 CET (12:15 + 180m). Candidate departs at 14:55 CET.
    // Physical transfer window is -20m, failing 45m MCT by -65m.
    const optA = result.options.find((o) => o.id === 'OPT-RECOVER-A')!;
    expect(optA.hardGatePassed).toBe(false);
    expect(optA.gateBreaches.some((b) => b.includes('Physical Impossibility'))).toBe(true);
  });
});

