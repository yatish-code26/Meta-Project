import { DateTime } from 'luxon';
import { UserTripInput, CandidateOptionInput } from '../../types/tripBuilder';
import { getAirportByIata } from '../../data/airports';
import { RecoveryOption, ConstraintCheckResult } from '../../types/travel';

export interface DynamicLegUtc {
  id: string;
  originIata: string;
  destinationIata: string;
  flightNumber: string;
  carrier: string;
  departureTimeLocal: string;
  arrivalTimeLocal: string;
  departureUtc: Date;
  arrivalUtc: Date;
  departureZone: string;
  arrivalZone: string;
}

export interface DynamicConnectionStatus {
  isConnectionMissed: boolean;
  isLegCancelled: boolean;
  hubIata: string;
  scheduledLayoverMinutes: number;
  effectiveLayoverMinutes: number;
  connectionMarginMinutes: number;
  statusCategory: 'ON_SCHEDULE' | 'TIGHT_BUFFER' | 'MISSED_CONNECTION' | 'CANCELLED';
  statusHeadline: string;
  statusExplanation: string;
}

export interface DynamicEngineResult {
  legsUtc: DynamicLegUtc[];
  commitmentDeadlineUtc: Date;
  connectionStatus: DynamicConnectionStatus;
  evaluatedOptions: RecoveryOption[];
}

export class DynamicTripEngine {
  /**
   * Convert local date-time strings to UTC Date using airport IANA zones.
   */
  public static parseInstant(localIso: string, ianaZone: string): Date {
    const dt = DateTime.fromISO(localIso, { zone: ianaZone });
    if (!dt.isValid) {
      throw new Error(`Invalid local date-time "${localIso}" for IANA zone "${ianaZone}": ${dt.invalidExplanation}`);
    }
    return dt.toJSDate();
  }

  public static evaluateTrip(
    tripInput: UserTripInput,
    candidateInputs: CandidateOptionInput[]
  ): DynamicEngineResult {
    // 1. Parse all legs to true UTC instants
    const legsUtc: DynamicLegUtc[] = tripInput.legs.map((leg) => {
      const origAirport = getAirportByIata(leg.originIata);
      const destAirport = getAirportByIata(leg.destinationIata);

      const origZone = origAirport?.ianaZone || 'UTC';
      const destZone = destAirport?.ianaZone || 'UTC';

      return {
        id: leg.id,
        originIata: leg.originIata,
        destinationIata: leg.destinationIata,
        flightNumber: leg.flightNumber,
        carrier: leg.carrier,
        departureTimeLocal: leg.departureTimeLocal,
        arrivalTimeLocal: leg.arrivalTimeLocal,
        departureUtc: this.parseInstant(leg.departureTimeLocal, origZone),
        arrivalUtc: this.parseInstant(leg.arrivalTimeLocal, destZone),
        departureZone: origZone,
        arrivalZone: destZone,
      };
    });

    // 2. Parse commitment deadline to UTC
    const commitmentDeadlineUtc = this.parseInstant(
      tripInput.deadlineTimeLocal,
      tripInput.deadlineIanaZone
    );

    // 3. Compute connection dynamics at hub (if trip has >= 2 legs)
    let connectionStatus: DynamicConnectionStatus;

    if (legsUtc.length >= 2) {
      const leg1 = legsUtc[0];
      const leg2 = legsUtc[1];
      const hubAirport = getAirportByIata(leg1.destinationIata);
      const hubIata = leg1.destinationIata;

      const scheduledLayoverMins = Math.round(
        (leg2.departureUtc.getTime() - leg1.arrivalUtc.getTime()) / 60000
      );

      const isCancelled = tripInput.disruption.type === 'CANCELLATION';
      const delayMins = isCancelled ? 0 : tripInput.disruption.delayMinutes;

      // Inbound actual touchdown
      const actualTouchdownUtc = new Date(leg1.arrivalUtc.getTime() + delayMins * 60000);
      const effectiveLayoverMins = isCancelled
        ? 0
        : Math.round((leg2.departureUtc.getTime() - actualTouchdownUtc.getTime()) / 60000);

      const marginMins = isCancelled
        ? -tripInput.mctBufferMinutes
        : effectiveLayoverMins - tripInput.mctBufferMinutes;

      const isMissed = isCancelled || marginMins < 0;

      let statusCategory: DynamicConnectionStatus['statusCategory'] = 'ON_SCHEDULE';
      let statusHeadline = 'Connection On Schedule';
      let statusExplanation = `Inbound delay of +${delayMins}m leaves ${effectiveLayoverMins}m transfer time, exceeding required ${tripInput.mctBufferMinutes}m MCT at ${hubIata}.`;

      if (isCancelled) {
        statusCategory = 'CANCELLED';
        statusHeadline = `Critical: Inbound Leg ${leg1.flightNumber} Cancelled`;
        statusExplanation = `Inbound flight ${leg1.flightNumber} to ${hubIata} has been cancelled (${tripInput.disruption.reason}). Onward connection to ${leg2.flightNumber} cannot be boarded.`;
      } else if (isMissed) {
        statusCategory = 'MISSED_CONNECTION';
        statusHeadline = `Connection Breached at ${hubIata}`;
        statusExplanation = `Inbound delay of +${delayMins}m compresses transfer window down to ${effectiveLayoverMins}m, failing ${hubIata} Minimum Connection Time (${tripInput.mctBufferMinutes}m) by ${Math.abs(marginMins)}m.`;
      } else if (marginMins < 20) {
        statusCategory = 'TIGHT_BUFFER';
        statusHeadline = `Tight Connection Buffer at ${hubIata}`;
        statusExplanation = `Transfer window is ${effectiveLayoverMins}m (${marginMins}m above MCT). Elevated risk of missed luggage or gate boarding lockout.`;
      }

      connectionStatus = {
        isConnectionMissed: isMissed,
        isLegCancelled: isCancelled,
        hubIata,
        scheduledLayoverMinutes: scheduledLayoverMins,
        effectiveLayoverMinutes: effectiveLayoverMins,
        connectionMarginMinutes: marginMins,
        statusCategory,
        statusHeadline,
        statusExplanation,
      };
    } else {
      // Single leg
      connectionStatus = {
        isConnectionMissed: false,
        isLegCancelled: tripInput.disruption.type === 'CANCELLATION',
        hubIata: tripInput.legs[0]?.destinationIata || 'DEST',
        scheduledLayoverMinutes: 0,
        effectiveLayoverMinutes: 0,
        connectionMarginMinutes: 999,
        statusCategory: 'ON_SCHEDULE',
        statusHeadline: 'Direct Journey',
        statusExplanation: 'Single leg journey without connection risk.',
      };
    }

    // 4. Short-circuit: if connection intact, do not show recovery options
    if (!connectionStatus.isConnectionMissed) {
      return {
        legsUtc,
        commitmentDeadlineUtc,
        connectionStatus,
        evaluatedOptions: [],
      };
    }

    // 5. Evaluate all candidate options (both user-entered and AI-proposed)
    const evaluatedOptions: RecoveryOption[] = candidateInputs.map((cand) => {
      const checks: ConstraintCheckResult[] = [];
      const gateBreaches: string[] = [];

      // Parse candidate legs to UTC
      const candLegsUtc = cand.legs.map((l, idx) => {
        const orig = getAirportByIata(l.originIata);
        const dest = getAirportByIata(l.destinationIata);
        const oz = orig?.ianaZone || 'UTC';
        const dz = dest?.ianaZone || 'UTC';
        return {
          ...l,
          depUtc: this.parseInstant(l.departureTimeLocal, oz),
          arrUtc: this.parseInstant(l.arrivalTimeLocal, dz),
          originAirport: orig,
          destAirport: dest,
        };
      });

      const firstLeg = candLegsUtc[0];
      const lastLeg = candLegsUtc[candLegsUtc.length - 1];

      // Gate 1: Physical connection feasibility from actual inbound touchdown to candidate departure
      const inboundTouchdownUtc = connectionStatus.isLegCancelled
        ? new Date(legsUtc[0].departureUtc.getTime()) // cancelled before departure
        : new Date(legsUtc[0].arrivalUtc.getTime() + tripInput.disruption.delayMinutes * 60000);

      const availableWindowMins = Math.round(
        (firstLeg.depUtc.getTime() - inboundTouchdownUtc.getTime()) / 60000
      );
      const mctMargin = availableWindowMins - tripInput.mctBufferMinutes;
      const mctPassed = mctMargin >= 0;

      if (mctPassed) {
        checks.push({
          name: `Physical Gate: Hub Connection Time (${tripInput.mctBufferMinutes}m MCT required)`,
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: `Transfer window is ${availableWindowMins}m, exceeding ${tripInput.mctBufferMinutes}m MCT by +${mctMargin}m.`,
        });
      } else {
        const breachMsg = `Physical Impossibility: Available transfer time (${availableWindowMins}m) violates hub MCT (${tripInput.mctBufferMinutes}m). Gates will be locked.`;
        gateBreaches.push(breachMsg);
        checks.push({
          name: `Physical Gate: Hub Connection Time (${tripInput.mctBufferMinutes}m MCT required)`,
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: breachMsg,
        });
      }

      // Gate 2: Arrival Deadline
      const deadlinePassed = lastLeg.arrUtc.getTime() <= commitmentDeadlineUtc.getTime();
      const diffHours = (
        (lastLeg.arrUtc.getTime() - commitmentDeadlineUtc.getTime()) /
        3600000
      ).toFixed(1);

      if (deadlinePassed) {
        checks.push({
          name: `Hard Gate: Mandatory Arrival Deadline (${tripInput.commitmentTitle})`,
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: `Arrives safely before ${tripInput.deadlineTimeLocal} commitment (${Math.abs(parseFloat(diffHours))}h buffer).`,
        });
      } else {
        const breachMsg = `Deadline Breach: Arrives +${diffHours}h after mandatory commitment (${tripInput.commitmentTitle}).`;
        gateBreaches.push(breachMsg);
        checks.push({
          name: `Hard Gate: Mandatory Arrival Deadline (${tripInput.commitmentTitle})`,
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: breachMsg,
        });
      }

      // Gate 3: Budget Ceiling
      const budgetPassed = cand.cost <= tripInput.budgetCeiling;
      if (budgetPassed) {
        checks.push({
          name: `Hard Gate: Recovery Budget Ceiling ($${tripInput.budgetCeiling} USD Max)`,
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: `Out-of-pocket cost is $${cand.cost} USD (within $${tripInput.budgetCeiling} cap).`,
        });
      } else {
        const breachMsg = `Budget Breach: Extra cost of $${cand.cost} USD exceeds allowed ceiling of $${tripInput.budgetCeiling} USD.`;
        gateBreaches.push(breachMsg);
        checks.push({
          name: `Hard Gate: Recovery Budget Ceiling ($${tripInput.budgetCeiling} USD Max)`,
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: breachMsg,
        });
      }

      // Gate 4: Transit Visa / Schengen border rules
      const requiresLandside = Boolean(cand.requiresLandsideTransit);
      const hubAirport = getAirportByIata(firstLeg.originIata);
      const isSchengenHub = hubAirport?.isSchengen || false;
      const visaPassed = !(requiresLandside && isSchengenHub && !tripInput.hasSchengenVisa);

      if (visaPassed) {
        checks.push({
          name: 'Hard Gate: Immigration & Border Clearance',
          isHardGate: true,
          passed: true,
          severity: 'PASS',
          detail: requiresLandside
            ? 'Schengen border transit permitted by traveler profile.'
            : 'Remains strictly within international airside corridor.',
        });
      } else {
        const breachMsg = 'Immigration Barrier: Route requires entering Schengen landside zone without visa permit.';
        gateBreaches.push(breachMsg);
        checks.push({
          name: 'Hard Gate: Immigration & Border Clearance',
          isHardGate: true,
          passed: false,
          severity: 'FATAL_BREACH',
          detail: breachMsg,
        });
      }

      const hardGatePassed = gateBreaches.length === 0;

      // Soft scoring
      let feasibilityScore = 0;
      if (hardGatePassed) {
        let score = 100;
        if (cand.cost > 0) score -= Math.min(25, Math.round(cand.cost / 20));
        if (mctMargin < 30) score -= 15;
        feasibilityScore = Math.max(50, Math.min(100, score));
      }

      // Calculate total delay hours vs original scheduled arrival
      const origFinalArrUtc = legsUtc[legsUtc.length - 1].arrivalUtc;
      const totalDelayHours = Math.max(
        0,
        parseFloat(((lastLeg.arrUtc.getTime() - origFinalArrUtc.getTime()) / 3600000).toFixed(1))
      );

      const sourceLabel =
        cand.source === 'user-entered'
          ? 'user-entered'
          : 'AI-proposed, availability unverified';

      return {
        id: cand.id,
        title: cand.title,
        subtitle: `[${sourceLabel}] • ${cand.carrierSummary}`,
        recoveryMode: cand.recoveryMode,
        carrierSummary: cand.carrierSummary,
        estimatedTotalCost: cand.cost + 1200,
        airlineCoveredAmount: 1200,
        outOfPocketCost: cand.cost,
        finalArrivalTime: lastLeg.arrivalTimeLocal,
        totalDelayHours,
        hardGatePassed,
        gateBreaches,
        feasibilityScore,
        eligibilityStatus: hardGatePassed ? 'QUALIFIED_RECOMMENDED' : 'DISQUALIFIED_GATE_FAILED',
        constraintChecks: checks,
        assumptions: [
          {
            id: `asm-${cand.id}-1`,
            category: 'UNVERIFIED_DATA',
            title: `Route source: ${sourceLabel}`,
            detail: 'Seat availability and rebooking authorization require agent confirmation.',
            riskLevel: cand.source === 'user-entered' ? 'LOW' : 'MEDIUM',
            verificationAction: 'Verify via airline reservation system.',
          },
        ],
        nextSteps: [
          {
            stepNumber: 1,
            location: `${firstLeg.originIata} Terminal`,
            action: `Proceed to ${firstLeg.carrier} service counter with booking code.`,
            mandatory: true,
          },
          {
            stepNumber: 2,
            location: `Gate ${firstLeg.originIata}`,
            action: `Board flight ${firstLeg.flightNumber} to ${firstLeg.destinationIata}.`,
            mandatory: true,
          },
        ],
        newSegments: candLegsUtc.map((cl, i) => ({
          id: `cand-seg-${cand.id}-${i}`,
          type: 'flight' as const,
          code: cl.flightNumber,
          title: `${cl.carrier} ${cl.flightNumber}`,
          carrier: cl.carrier,
          departureLocation: cl.originIata,
          arrivalLocation: cl.destinationIata,
          departureTime: cl.departureTimeLocal.split('T')[1] || cl.departureTimeLocal,
          departureTimeZone: cl.originAirport?.ianaZone || 'UTC',
          arrivalTime: cl.arrivalTimeLocal.split('T')[1] || cl.arrivalTimeLocal,
          arrivalTimeZone: cl.destAirport?.ianaZone || 'UTC',
          duration: `${Math.round((cl.arrUtc.getTime() - cl.depUtc.getTime()) / 3600000)}h`,
          dayNumber: 1,
          status: 'scheduled' as const,
        })),
        isRecommended: false,
        tradeOffSummary: hardGatePassed
          ? `Meets all hard gates with +${mctMargin}m hub buffer and arrives ${diffHours}h before commitment.`
          : `Disqualified: ${gateBreaches[0] || 'Operational gate failure'}`,
      };
    });

    const qualified = evaluatedOptions.filter((o) => o.hardGatePassed);
    if (qualified.length > 0) {
      qualified.sort((a, b) => b.feasibilityScore - a.feasibilityScore);
      qualified[0].isRecommended = true;
    }

    return {
      legsUtc,
      commitmentDeadlineUtc,
      connectionStatus,
      evaluatedOptions,
    };
  }
}
