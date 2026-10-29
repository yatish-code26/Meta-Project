import { describe, it, expect } from 'vitest';
import { INITIAL_TRIP_DATA, SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';
import { MetaRecoveryTestFixture, META_TEST_FIXTURE_DISCLAIMER } from '../services/meta/MetaRecoveryTestFixture';
import { RecoveryConstraintValidator } from '../services/validation/RecoveryConstraintValidator';
import { ConstraintCheckResult } from '../types/travel';

describe('RouteX Travel Recovery Logic & Gate Validation Suite', () => {
  it('1. Test Fixture schema compliance & transparent non-substitutive metadata', () => {
    const fixtureResponse = MetaRecoveryTestFixture.getMockResponse({
      trip: INITIAL_TRIP_DATA,
      disruption: SYNTHETIC_DISRUPTION_EVENT,
      constraints: INITIAL_TRIP_DATA.constraints,
      currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
      currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
    });

    expect(fixtureResponse.modelMetadata.isLiveApiCall).toBe(false);
    expect(fixtureResponse.modelMetadata.creditsStatus).toBe('AWAITING_CREDITS');
    expect(fixtureResponse.modelMetadata.disclaimer).toBe(META_TEST_FIXTURE_DISCLAIMER);
    expect(fixtureResponse.rawOptions).toHaveLength(3);
    expect(fixtureResponse.recommendedOptionId).toBe('OPT-RECOVER-A');
  });

  it('2. Hard Gate Evaluation: Option A satisfies 100% of hard constraints and qualifies as recommended', () => {
    const fixtureResponse = MetaRecoveryTestFixture.getMockResponse({
      trip: INITIAL_TRIP_DATA,
      disruption: SYNTHETIC_DISRUPTION_EVENT,
      constraints: INITIAL_TRIP_DATA.constraints,
      currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
      currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
    });

    const evaluatedOptions = RecoveryConstraintValidator.evaluateAll(
      fixtureResponse.rawOptions,
      INITIAL_TRIP_DATA,
      INITIAL_TRIP_DATA.constraints
    );

    const optionA = evaluatedOptions.find(o => o.id === 'OPT-RECOVER-A')!;
    expect(optionA).toBeDefined();

    // Must clear all hard gates
    expect(optionA.hardGatePassed).toBe(true);
    expect(optionA.gateBreaches).toHaveLength(0);
    expect(optionA.feasibilityScore).toBe(100);
    expect(optionA.eligibilityStatus).toBe('QUALIFIED_RECOMMENDED');
    expect(optionA.isRecommended).toBe(true);
    expect(optionA.outOfPocketCost).toBe(0);

    // Hard gate checks must all pass
    const hardChecks = optionA.constraintChecks.filter((c: ConstraintCheckResult) => c.isHardGate);
    expect(hardChecks.length).toBeGreaterThanOrEqual(3);
    expect(hardChecks.every((c: ConstraintCheckResult) => c.passed)).toBe(true);
  });

  it('3. Hard Gate Rejection: Option B is disqualified for Schengen border crossing & deadline breach', () => {
    const fixtureResponse = MetaRecoveryTestFixture.getMockResponse({
      trip: INITIAL_TRIP_DATA,
      disruption: SYNTHETIC_DISRUPTION_EVENT,
      constraints: INITIAL_TRIP_DATA.constraints,
      currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
      currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
    });

    const evaluatedOptions = RecoveryConstraintValidator.evaluateAll(
      fixtureResponse.rawOptions,
      INITIAL_TRIP_DATA,
      INITIAL_TRIP_DATA.constraints
    );

    const optionB = evaluatedOptions.find(o => o.id === 'OPT-RECOVER-B')!;
    expect(optionB).toBeDefined();

    // Must be disqualified at the gate level
    expect(optionB.hardGatePassed).toBe(false);
    expect(optionB.eligibilityStatus).toBe('DISQUALIFIED_GATE_FAILED');
    expect(optionB.isRecommended).toBe(false);
    expect(optionB.feasibilityScore).toBe(0);

    // Gate breaches must include visa border restriction and deadline
    expect(optionB.gateBreaches.length).toBeGreaterThanOrEqual(2);
    expect(optionB.gateBreaches.some(b => b.includes('Immigration Barrier'))).toBe(true);
    expect(optionB.gateBreaches.some(b => b.includes('14:00 JST'))).toBe(true);
  });

  it('4. Hard Gate Rejection: Option C is disqualified for Day 3 arrival exceeding hard deadline', () => {
    const fixtureResponse = MetaRecoveryTestFixture.getMockResponse({
      trip: INITIAL_TRIP_DATA,
      disruption: SYNTHETIC_DISRUPTION_EVENT,
      constraints: INITIAL_TRIP_DATA.constraints,
      currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
      currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
    });

    const evaluatedOptions = RecoveryConstraintValidator.evaluateAll(
      fixtureResponse.rawOptions,
      INITIAL_TRIP_DATA,
      INITIAL_TRIP_DATA.constraints
    );

    const optionC = evaluatedOptions.find(o => o.id === 'OPT-RECOVER-C')!;
    expect(optionC).toBeDefined();
    expect(optionC.hardGatePassed).toBe(false);
    expect(optionC.eligibilityStatus).toBe('DISQUALIFIED_GATE_FAILED');
    expect(optionC.isRecommended).toBe(false);
    expect(optionC.feasibilityScore).toBe(0);
  });

  it('5. Gate Enforcement Integrity: Route is rejected if budget ceiling is exceeded', () => {
    const fixtureResponse = MetaRecoveryTestFixture.getMockResponse({
      trip: INITIAL_TRIP_DATA,
      disruption: SYNTHETIC_DISRUPTION_EVENT,
      constraints: INITIAL_TRIP_DATA.constraints,
      currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
      currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
    });

    // Simulate a $0 budget ceiling constraint
    const zeroBudgetConstraints = {
      ...INITIAL_TRIP_DATA.constraints,
      maxRecoveryBudget: 0,
    };

    const evaluatedOptions = RecoveryConstraintValidator.evaluateAll(
      fixtureResponse.rawOptions,
      INITIAL_TRIP_DATA,
      zeroBudgetConstraints
    );

    // Option B ($140) and Option C ($280) must fail budget gate
    const optionB = evaluatedOptions.find(o => o.id === 'OPT-RECOVER-B')!;
    expect(optionB.constraintChecks.find(c => c.name.includes('Budget Ceiling'))?.passed).toBe(false);
  });

  it('6. Chronological and time zone integrity of the scenario', () => {
    expect(INITIAL_TRIP_DATA.constraints.hardArrivalDeadline).toContain('Day 2, 14:00 JST');
    expect(INITIAL_TRIP_DATA.constraints.visaTransitStatus).toContain('Airside Schengen Transit Only');
    expect(SYNTHETIC_DISRUPTION_EVENT.delayMinutes).toBe(75);
    expect(SYNTHETIC_DISRUPTION_EVENT.timeZone).toBe('CET (UTC+1)');
  });
});
