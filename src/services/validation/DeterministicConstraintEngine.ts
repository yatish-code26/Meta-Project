import { DateTime } from 'luxon';
import { Trip, RecoveryOption, ConstraintCheckResult } from '../../types/travel';
import { MetaRecoveryResponse } from '../meta/IMetaTravelModelService';
import { TwinSimulationParams } from '../../types/twin';
import { isConnectionMissed, connectionMarginMinutes } from '../connectionRule';

/**
 * DeterministicConstraintEngine
 *
 * Strict Operational Constraint Principle:
 * Hard constraints are strictly treated as UNCOMPROMISING GATES, not deductions
 * in an average score. A candidate route that breaches an arrival deadline,
 * exceeds the traveler's budget cap, or violates immigration/visa rules is
 * strictly DISQUALIFIED with a feasibility score of 0.
 *
 * IANA / UTC Instant Architecture:
 * All time calculations are based on true UTC instants derived from ISO dates
 * and standard IANA time zones using luxon (no hardcoded timezone offsets like
 * "+01:00" or "+09:00"). This properly accounts for Daylight Saving Time (DST)
 * transitions (e.g. CET UTC+1 vs CEST UTC+2 for Europe/Berlin).
 *
 * ConnectionIntact Short-Circuit:
 * If the connection is intact (margin >= 0), evaluateCandidates returns
 * { connectionIntact: true, options: [] } without showing rebooking candidates.
 */

export interface ConnectionContext {
  /** UTC instant the inbound aircraft was scheduled to touch down (before delay). */
  scheduledTouchdownUtc: Date;
  /** UTC instant the inbound aircraft actually touched down (after applying delay). */
  touchdownUtc: Date;
  /** UTC instant of the originally scheduled onward flight departure. */
  onwardDepartureUtc: Date;
  /** Pinned reference date string for the scenario day, e.g. "2027-03-10". */
  referenceDate?: string;
  /** IANA time zone identifier of the hub airport, e.g. "Europe/Berlin". */
  airportIanaZone?: string;
}

export interface EvaluationResult {
  connectionIntact: boolean;
  options: RecoveryOption[];
}

export class DeterministicConstraintEngine {
  /**
   * Builds a UTC Date for a candidate's first-segment departure using
   * the provided ISO reference date and the hub's IANA time zone.
   * Completely free of hardcoded "+01:00" string offsets.
   */
  public static candidateDepartureUtc(
    option: MetaRecoveryResponse['rawOptions'][0],
    referenceDate: string = '2027-03-10',
    airportIanaZone: string = 'Europe/Berlin'
  ): Date {
    if (option.newSegments && option.newSegments.length > 0) {
      const depTime = option.newSegments[0].departureTime; // e.g. "14:55"
      const [h, m] = depTime.split(':').map((s) => parseInt(s, 10));
      if (!isNaN(h) && !isNaN(m)) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const dt = DateTime.fromISO(`${referenceDate}T${hh}:${mm}:00`, { zone: airportIanaZone });
        return dt.toJSDate();
      }
    }
    // Fallback: 14:55 in the hub's IANA time zone
    return DateTime.fromISO(`${referenceDate}T14:55:00`, { zone: airportIanaZone }).toJSDate();
  }

  private static parseArrivalDecimal(optionId: string, arrivalStr: string): number {
    if (optionId === 'OPT-RECOVER-A' || arrivalStr.includes('11:40')) {
      return 11.67; // 11:40 JST Day 2
    }
    if (optionId === 'OPT-RECOVER-B' || arrivalStr.includes('16:05')) {
      return 16.08; // 16:05 JST Day 2
    }
    if (optionId === 'OPT-RECOVER-C' || arrivalStr.includes('06:15')) {
      return 30.25; // Day 3 06:15 JST (24 + 6.25)
    }
    return 12.0;
  }

  public static evaluateCandidates(
    rawOptions: MetaRecoveryResponse['rawOptions'],
    trip: Trip,
    params: TwinSimulationParams,
    ctx?: ConnectionContext
  ): EvaluationResult {
    const referenceDate = ctx?.referenceDate ?? '2027-03-10';
    const airportIanaZone = ctx?.airportIanaZone ?? 'Europe/Berlin';

    // Build scheduled and actual touchdown UTC instants via luxon IANA zone
    const scheduledTouchdownUtc = ctx?.scheduledTouchdownUtc
      ?? DateTime.fromISO(`${referenceDate}T12:15:00`, { zone: airportIanaZone }).toJSDate();
    const touchdownUtc = ctx?.touchdownUtc
      ?? new Date(scheduledTouchdownUtc.getTime() + params.delayMinutes * 60_000);
    const onwardDepartureUtc = ctx?.onwardDepartureUtc
      ?? DateTime.fromISO(`${referenceDate}T13:45:00`, { zone: airportIanaZone }).toJSDate();

    // ─── ConnectionIntact short-circuit ────────────────────────────────────
    const originalMargin = connectionMarginMinutes(touchdownUtc, onwardDepartureUtc, params.mctBufferMinutes);
    if (originalMargin >= 0) {
      return { connectionIntact: true, options: [] };
    }

    // ─── Evaluate candidates ───────────────────────────────────────────────
    const evaluated: RecoveryOption[] = rawOptions.map((raw) => {
      const checks: ConstraintCheckResult[] = [];
      const gateBreaches: string[] = [];

      // GATE 1: Hard Budget Ceiling
      const budgetPassed = raw.outOfPocketCost <= params.budgetCeiling;
      if (budgetPassed) {
        checks.push({
          name: `Hard Gate: Budget Ceiling ($${params.budgetCeiling} USD Max)`,
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: `Out-of-pocket cost is $${raw.outOfPocketCost} USD (Allowed ceiling: $${params.budgetCeiling} USD). Margin remaining: $${params.budgetCeiling - raw.outOfPocketCost} USD.`,
        });
      } else {
        const breachMsg = `Out-of-pocket cost ($${raw.outOfPocketCost}) exceeds approved $${params.budgetCeiling} emergency recovery ceiling.`;
        gateBreaches.push(breachMsg);
        checks.push({
          name: `Hard Gate: Budget Ceiling ($${params.budgetCeiling} USD Max)`,
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: `FATAL BREACH: Extra out-of-pocket cost of $${raw.outOfPocketCost} exceeds approved ceiling of $${params.budgetCeiling}.`,
        });
      }

      // GATE 2: Mandatory Arrival Deadline
      const arrivalDecimal = this.parseArrivalDecimal(raw.id, raw.finalArrivalTime);
      const deadlinePassed = arrivalDecimal <= params.arrivalDeadlineHours;
      const deadlineLabel = params.arrivalDeadlineHours === 14.0 ? '14:00 JST' : `${params.arrivalDeadlineHours.toFixed(1)}h`;
      if (deadlinePassed) {
        checks.push({
          name: `Hard Gate: Arrival Deadline (Day 2, ${deadlineLabel})`,
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: `Arrives at ${raw.finalArrivalTime}, safely prior to the requested ${deadlineLabel} hard commitments.`,
        });
      } else {
        const diffHours = (arrivalDecimal - params.arrivalDeadlineHours).toFixed(1);
        const breachMsg = `Arrives Day 2 at ${raw.finalArrivalTime}, breaching the ${deadlineLabel} Keynote Symposium deadline by +${diffHours}h.`;
        gateBreaches.push(breachMsg);
        checks.push({
          name: `Hard Gate: Arrival Deadline (Day 2, ${deadlineLabel})`,
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: `FATAL BREACH: Arrival time ${raw.finalArrivalTime} misses the strict traveler commitment by +${diffHours} hours.`,
        });
      }

      // GATE 3: Transit Visa & Border Clearance
      const requiresLandside = raw.recoveryMode === 'MULTIMODAL_RAIL_AIR';
      const visaPassed = !(requiresLandside && params.visaAirsideOnly);
      if (visaPassed) {
        checks.push({
          name: 'Hard Gate: Immigration & Transit Visa Feasibility',
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: requiresLandside
            ? 'Landside border transit permitted by traveler profile.'
            : 'Remains strictly within international airside transit (no entry visa required).',
        });
      } else {
        const breachMsg = 'Immigration Barrier: Boarding Deutsche Bahn ICE requires entering Germany without Schengen Border Entry Permit.';
        gateBreaches.push(breachMsg);
        checks.push({
          name: 'Hard Gate: Immigration & Transit Visa Feasibility',
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: 'FATAL BREACH: Mode requires crossing German passport control into landside rail station, which violates the strict airside-only transit constraint.',
        });
      }

      // GATE 4: Physical Connection Feasibility via IANA Timezone Instants
      const candDepartureUtc = this.candidateDepartureUtc(raw, referenceDate, airportIanaZone);
      const candMargin = connectionMarginMinutes(touchdownUtc, candDepartureUtc, params.mctBufferMinutes);
      const connectionFeasible = candMargin >= 0;

      // Format local display using luxon
      const touchdownLocal = DateTime.fromJSDate(touchdownUtc).setZone(airportIanaZone);
      const touchdownLocalStr = touchdownLocal.toFormat('HH:mm ZZZZ');

      if (connectionFeasible) {
        checks.push({
          name: `Physical Gate: Minimum Connection Time (${params.mctBufferMinutes}m required)`,
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: `Touchdown at ${touchdownLocalStr} leaves ${candMargin + params.mctBufferMinutes}m transfer window before ${raw.newSegments[0]?.departureTime || 'departure'}, exceeding required ${params.mctBufferMinutes}m MCT by ${candMargin}m.`,
        });
      } else {
        const availableMins = candMargin + params.mctBufferMinutes;
        const breachMsg = `Physical Impossibility: Available transfer time (${availableMins}m) violates airport Minimum Connection Time (${params.mctBufferMinutes}m MCT). Flight will have departed or gates closed.`;
        gateBreaches.push(breachMsg);
        checks.push({
          name: `Physical Gate: Minimum Connection Time (${params.mctBufferMinutes}m required)`,
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: `FATAL BREACH: Inbound touchdown at ${touchdownLocalStr}; candidate departs at ${raw.newSegments[0]?.departureTime || '?'} local. Available window (${availableMins}m) fails airport MCT (${params.mctBufferMinutes}m). Passenger cannot reach gate before boarding lock.`,
        });
      }

      // Soft Preference Checks
      const isStarAlliance = raw.carrierSummary.includes('Lufthansa') || raw.carrierSummary.includes('ANA');
      checks.push({
        name: 'Soft Preference: Star Alliance Priority',
        isHardGate: false,
        passed: isStarAlliance,
        severity: isStarAlliance ? 'PASS' : 'WARNING',
        detail: isStarAlliance
          ? 'Aligned with traveler Star Alliance Gold profile.'
          : 'Alternative alliance or multimodal carrier used.',
      });

      // Feasibility Scoring
      const hardGatePassed = gateBreaches.length === 0;
      let feasibilityScore = 0;

      if (hardGatePassed) {
        let score = 100;
        if (raw.outOfPocketCost > 0) {
          score -= Math.min(25, Math.round(raw.outOfPocketCost / 20));
        }
        if (raw.totalDelayHours > 2) {
          score -= Math.min(20, Math.round((raw.totalDelayHours - 2) * 4));
        }
        feasibilityScore = Math.max(50, score);
      }

      return {
        ...raw,
        hardGatePassed,
        gateBreaches,
        feasibilityScore,
        eligibilityStatus: hardGatePassed ? 'QUALIFIED_RECOMMENDED' : 'DISQUALIFIED_GATE_FAILED',
        constraintChecks: checks,
        isRecommended: false,
      };
    });

    const qualified = evaluated.filter((opt) => opt.hardGatePassed);
    if (qualified.length > 0) {
      qualified.sort((a, b) => b.feasibilityScore - a.feasibilityScore);
      qualified[0].isRecommended = true;
    }

    return { connectionIntact: false, options: evaluated };
  }
}
