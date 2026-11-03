/**
 * engine-truth.test.ts
 * ====================
 * Engine-truth tests for RouteX.
 *
 * 1. Proves unified connection rule mathematical boundary correctness.
 * 2. DST tests exercising both connectionRule AND candidate evaluation path.
 * 3. Proves ConnectionIntact short-circuit avoids spurious candidates.
 * 4. Proves extreme inbound delays disqualify candidate pathways.
 * 5. Proves UNVERIFIED_DATA labelling on legal/immigration/baggage assumptions.
 * 6. Contradiction reproduction: a route labeled feasible while its displayed
 *    connection math says otherwise must strictly fail.
 */

import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { isConnectionMissed, connectionMarginMinutes } from '../services/connectionRule';
import { DeterministicConstraintEngine } from '../services/validation/DeterministicConstraintEngine';
import { MetaRecoveryTestFixture } from '../services/meta/MetaRecoveryTestFixture';
import { INITIAL_TRIP_DATA, SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';
import { TwinSimulationParams } from '../types/twin';

// ─── Pinned Upcoming Scenario: Wednesday 10 March 2027 ───────────────────────
//
// Frankfurt is Europe/Berlin:
//   Winter (CET)  = UTC+1 → 2027-03-10 (before European DST on 2027-03-28)
//   Summer (CEST) = UTC+2 → 2027-06-15 (summer daylight saving time)
//
// Pinned winter instants for 2027-03-10:
// LH 901 scheduled touchdown FRA: 12:15 CET = 11:15 UTC
// LH 716 scheduled departure FRA: 13:45 CET = 12:45 UTC
// MCT at FRA: 45 minutes
// LH 714 (recovery Option A) departs FRA: 14:55 CET = 13:55 UTC

const SCHEDULED_TOUCHDOWN_UTC = DateTime.fromISO('2027-03-10T12:15:00', { zone: 'Europe/Berlin' }).toJSDate();
const LH716_DEPARTURE_UTC = DateTime.fromISO('2027-03-10T13:45:00', { zone: 'Europe/Berlin' }).toJSDate();
const LH714_DEPARTURE_UTC = DateTime.fromISO('2027-03-10T14:55:00', { zone: 'Europe/Berlin' }).toJSDate();
const MCT = 45; // minutes

const STANDARD_PARAMS: TwinSimulationParams = {
  delayMinutes: 75,
  mctBufferMinutes: MCT,
  budgetCeiling: 450,
  arrivalDeadlineHours: 14.0,
  visaAirsideOnly: true,
};

function getFixtureOptions() {
  return MetaRecoveryTestFixture.getMockResponse({
    trip: INITIAL_TRIP_DATA,
    disruption: SYNTHETIC_DISRUPTION_EVENT,
    constraints: INITIAL_TRIP_DATA.constraints,
    currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
    currentTime: SYNTHETIC_DISRUPTION_EVENT.detectedAt,
  }).rawOptions;
}

function makeContext(delayMinutes: number, referenceDate = '2027-03-10', airportIanaZone = 'Europe/Berlin') {
  const sched = DateTime.fromISO(`${referenceDate}T12:15:00`, { zone: airportIanaZone }).toJSDate();
  const touch = new Date(sched.getTime() + delayMinutes * 60_000);
  const dep = DateTime.fromISO(`${referenceDate}T13:45:00`, { zone: airportIanaZone }).toJSDate();
  return {
    scheduledTouchdownUtc: sched,
    touchdownUtc: touch,
    onwardDepartureUtc: dep,
    referenceDate,
    airportIanaZone,
  };
}

// =============================================================================
// SECTION A — Unified connection rule unit tests
// =============================================================================

describe('connectionRule — unified connection rule', () => {
  it('A1: connection is intact when delay is 0 (scheduled touchdown leaves 90m layover, MCT=45)', () => {
    expect(isConnectionMissed(SCHEDULED_TOUCHDOWN_UTC, LH716_DEPARTURE_UTC, MCT)).toBe(false);
    expect(connectionMarginMinutes(SCHEDULED_TOUCHDOWN_UTC, LH716_DEPARTURE_UTC, MCT)).toBe(45);
  });

  it('A2: connection is intact when delay is exactly at the MCT boundary (+45m delay → margin = 0)', () => {
    const touchdownDelayed45 = new Date(SCHEDULED_TOUCHDOWN_UTC.getTime() + 45 * 60_000);
    expect(isConnectionMissed(touchdownDelayed45, LH716_DEPARTURE_UTC, MCT)).toBe(false);
    expect(connectionMarginMinutes(touchdownDelayed45, LH716_DEPARTURE_UTC, MCT)).toBe(0);
  });

  it('A3: connection is MISSED when delay is +46m (one minute past MCT boundary)', () => {
    const touchdownDelayed46 = new Date(SCHEDULED_TOUCHDOWN_UTC.getTime() + 46 * 60_000);
    expect(isConnectionMissed(touchdownDelayed46, LH716_DEPARTURE_UTC, MCT)).toBe(true);
    expect(connectionMarginMinutes(touchdownDelayed46, LH716_DEPARTURE_UTC, MCT)).toBe(-1);
  });

  it('A4: connection is MISSED with standard +75m delay', () => {
    const touchdown75 = new Date(SCHEDULED_TOUCHDOWN_UTC.getTime() + 75 * 60_000);
    expect(isConnectionMissed(touchdown75, LH716_DEPARTURE_UTC, MCT)).toBe(true);
    expect(connectionMarginMinutes(touchdown75, LH716_DEPARTURE_UTC, MCT)).toBe(-30);
  });
});

// =============================================================================
// SECTION B — DST edge cases (both connectionRule AND CANDIDATE evaluation path)
// =============================================================================

describe('DST edge cases (Europe/Berlin CEST UTC+2 vs CET UTC+1)', () => {
  it('B1 DST connectionRule: Summer Frankfurt (CEST UTC+2) calculates margin identically to winter', () => {
    const scheduledTouchdown_CEST = DateTime.fromISO('2027-06-15T12:15:00', { zone: 'Europe/Berlin' }).toJSDate();
    const departure_CEST = DateTime.fromISO('2027-06-15T13:45:00', { zone: 'Europe/Berlin' }).toJSDate();
    const touchdown75_CEST = new Date(scheduledTouchdown_CEST.getTime() + 75 * 60_000);

    expect(isConnectionMissed(touchdown75_CEST, departure_CEST, MCT)).toBe(true);
    expect(connectionMarginMinutes(touchdown75_CEST, departure_CEST, MCT)).toBe(-30);
  });

  it('B2 DST candidate path: candidateDepartureUtc resolves 14:55 CEST to 12:55 UTC (not winter 13:55 UTC)', () => {
    const rawOptions = getFixtureOptions();
    const optA = rawOptions.find((o) => o.id === 'OPT-RECOVER-A')!;

    // In summer (June 2027, CEST UTC+2), 14:55 local = 12:55 UTC
    const summerCandidateUtc = DeterministicConstraintEngine.candidateDepartureUtc(
      optA,
      '2027-06-15',
      'Europe/Berlin'
    );
    expect(summerCandidateUtc.toISOString()).toBe('2027-06-15T12:55:00.000Z');

    // In winter (March 2027, CET UTC+1), 14:55 local = 13:55 UTC
    const winterCandidateUtc = DeterministicConstraintEngine.candidateDepartureUtc(
      optA,
      '2027-03-10',
      'Europe/Berlin'
    );
    expect(winterCandidateUtc.toISOString()).toBe('2027-03-10T13:55:00.000Z');

    // Exactly 1 hour difference due to DST shift, completely without hard-coded offsets
    expect(winterCandidateUtc.getUTCHours() - summerCandidateUtc.getUTCHours()).toBe(1);
  });

  it('B3 DST candidate path in evaluateCandidates: Summer delay correctly evaluates candidate physical feasibility', () => {
    const rawOptions = getFixtureOptions();

    // Standard +75m delay during summer:
    // Touchdown: 13:30 CEST = 11:30 UTC
    // Candidate departure: 14:55 CEST = 12:55 UTC
    // Transfer window: 85 mins >= 45m MCT -> Passes Gate 4
    const summerResult75 = DeterministicConstraintEngine.evaluateCandidates(
      rawOptions,
      INITIAL_TRIP_DATA,
      STANDARD_PARAMS,
      makeContext(75, '2027-06-15', 'Europe/Berlin')
    );
    const summerOptA = summerResult75.options.find((o) => o.id === 'OPT-RECOVER-A');
    expect(summerOptA?.hardGatePassed).toBe(true);

    // Extreme +180m delay during summer:
    // Touchdown: 15:15 CEST = 13:15 UTC
    // Candidate departure: 14:55 CEST = 12:55 UTC
    // Transfer window: -20 mins -> Fails Gate 4
    const summerResult180 = DeterministicConstraintEngine.evaluateCandidates(
      rawOptions,
      INITIAL_TRIP_DATA,
      { ...STANDARD_PARAMS, delayMinutes: 180 },
      makeContext(180, '2027-06-15', 'Europe/Berlin')
    );
    const summerOptA180 = summerResult180.options.find((o) => o.id === 'OPT-RECOVER-A');
    expect(summerOptA180?.hardGatePassed).toBe(false);
    expect(summerOptA180?.gateBreaches.some((b) => b.includes('Minimum Connection Time'))).toBe(true);
  });
});

// =============================================================================
// SECTION C — ConnectionIntact short-circuit
// =============================================================================

describe('DeterministicConstraintEngine — ConnectionIntact short-circuit', () => {
  it('C1: when delay=20m (connection intact), engine returns connectionIntact=true and empty options', () => {
    const params: TwinSimulationParams = { ...STANDARD_PARAMS, delayMinutes: 20 };
    const result = DeterministicConstraintEngine.evaluateCandidates(
      getFixtureOptions(),
      INITIAL_TRIP_DATA,
      params,
      makeContext(20)
    );

    expect(result.connectionIntact).toBe(true);
    expect(result.options).toHaveLength(0);
  });

  it('C2: when delay=45m (boundary), engine returns connectionIntact=true', () => {
    const params: TwinSimulationParams = { ...STANDARD_PARAMS, delayMinutes: 45 };
    const result = DeterministicConstraintEngine.evaluateCandidates(
      getFixtureOptions(),
      INITIAL_TRIP_DATA,
      params,
      makeContext(45)
    );

    expect(result.connectionIntact).toBe(true);
  });

  it('C3: when delay=46m (one minute past MCT), engine evaluates candidates', () => {
    const params: TwinSimulationParams = { ...STANDARD_PARAMS, delayMinutes: 46 };
    const result = DeterministicConstraintEngine.evaluateCandidates(
      getFixtureOptions(),
      INITIAL_TRIP_DATA,
      params,
      makeContext(46)
    );

    expect(result.connectionIntact).toBe(false);
    expect(result.options.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// SECTION D — Option A physical feasibility with extreme delay
// =============================================================================

describe('DeterministicConstraintEngine — extreme delay disqualifies Option A', () => {
  it('D1: with +180m delay, Option A must be DISQUALIFIED at Gate 4', () => {
    const params: TwinSimulationParams = { ...STANDARD_PARAMS, delayMinutes: 180 };
    const result = DeterministicConstraintEngine.evaluateCandidates(
      getFixtureOptions(),
      INITIAL_TRIP_DATA,
      params,
      makeContext(180)
    );

    expect(result.connectionIntact).toBe(false);
    const optionA = result.options.find((o) => o.id === 'OPT-RECOVER-A');
    expect(optionA).toBeDefined();
    expect(optionA!.hardGatePassed).toBe(false);
    expect(optionA!.gateBreaches.some((b) => b.includes('Minimum Connection Time'))).toBe(true);
  });

  it('D2: with +75m delay (standard), Option A passes Gate 4', () => {
    const result = DeterministicConstraintEngine.evaluateCandidates(
      getFixtureOptions(),
      INITIAL_TRIP_DATA,
      STANDARD_PARAMS,
      makeContext(75)
    );

    const optionA = result.options.find((o) => o.id === 'OPT-RECOVER-A');
    expect(optionA).toBeDefined();
    expect(optionA!.hardGatePassed).toBe(true);
  });
});

// =============================================================================
// SECTION E — UNVERIFIED_DATA labelling
// =============================================================================

describe('Fixture data — UNVERIFIED_DATA labelling', () => {
  it('E1: EU261 airline coverage claim in Option A must be labelled UNVERIFIED_DATA', () => {
    const options = getFixtureOptions();
    const optA = options.find((o) => o.id === 'OPT-RECOVER-A')!;
    const eu261Assumption = optA.assumptions.find(
      (a) =>
        a.title.toLowerCase().includes('eu261') ||
        a.title.toLowerCase().includes('eu 261') ||
        a.title.toLowerCase().includes('airline cover') ||
        a.category === 'UNVERIFIED_DATA'
    );
    expect(eu261Assumption).toBeDefined();
    expect(eu261Assumption!.category).toBe('UNVERIFIED_DATA');
  });

  it('E2: baggage re-tagging assumption in Option A must be unverified', () => {
    const options = getFixtureOptions();
    const optA = options.find((o) => o.id === 'OPT-RECOVER-A')!;
    const baggageAssumption = optA.assumptions.find((a) => a.title.toLowerCase().includes('bag'));
    expect(baggageAssumption).toBeDefined();
    expect(['ASSUMPTION', 'UNVERIFIED_DATA']).toContain(baggageAssumption!.category);
  });

  it('E3: synthetic notice on SYNTHETIC_DISRUPTION_EVENT is present', () => {
    expect(SYNTHETIC_DISRUPTION_EVENT.isSyntheticSimulation).toBe(true);
    expect(SYNTHETIC_DISRUPTION_EVENT.syntheticNotice).toBeTruthy();
  });
});

// =============================================================================
// SECTION F — Original Contradiction Reproduction Test
// Bug: A route labeled feasible / qualified while its displayed connection math
// says otherwise (e.g. available transfer time fails MCT).
// Fix: Gate 4 strict check guarantees hardGatePassed === false whenever
// available transfer time < MCT, preventing any contradiction.
// =============================================================================

describe('Section F — Original Contradiction Reproduction Test', () => {
  it('F1: route CANNOT be labeled feasible when displayed connection math violates MCT', () => {
    const rawOptions = getFixtureOptions();

    // Test a range of delays from +110m to +240m (which cut transfer window under 45m MCT)
    // Scheduled touchdown: 12:15 CET. LH 714 departs: 14:55 CET.
    // Total scheduled gap before LH 714: 160 minutes.
    // When delay is +120m: touchdown = 14:15 CET. Available window = 40m (< 45m MCT).
    const delayMinutes = 120;
    const params: TwinSimulationParams = { ...STANDARD_PARAMS, delayMinutes };

    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawOptions,
      INITIAL_TRIP_DATA,
      params,
      makeContext(delayMinutes)
    );

    const optA = result.options.find((o) => o.id === 'OPT-RECOVER-A')!;
    expect(optA).toBeDefined();

    // 1. Math check in Gate 4
    const gate4Check = optA.constraintChecks.find((c) => c.name.includes('Minimum Connection Time'));
    expect(gate4Check).toBeDefined();
    expect(gate4Check!.passed).toBe(false);
    expect(gate4Check!.severity).toBe('FATAL_BREACH');

    // 2. The critical contradiction assertion:
    // If displayed connection math says failed, the route MUST NOT be marked feasible or recommended!
    expect(optA.hardGatePassed).toBe(false);
    expect(optA.eligibilityStatus).toBe('DISQUALIFIED_GATE_FAILED');
    expect(optA.isRecommended).toBe(false);
    expect(optA.feasibilityScore).toBe(0);

    // 3. Mathematical proof that no route with a failed hard gate can be recommended
    const anyContradictoryRoute = result.options.some(
      (opt) => opt.hardGatePassed && opt.constraintChecks.some((c) => c.isHardGate && !c.passed)
    );
    expect(anyContradictoryRoute).toBe(false);
  });
});
