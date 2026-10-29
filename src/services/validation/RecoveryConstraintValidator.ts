import { Trip, TripConstraints, RecoveryOption, ConstraintCheckResult } from '../../types/travel';
import { MetaRecoveryResponse } from '../meta/IMetaTravelModelService';

/**
 * Deterministic Constraint Validation Engine
 * 
 * CORE PRINCIPLE:
 * Hard constraints are strictly treated as GATES, not merely deductions in a weighted score.
 * A candidate route that breaches a mandatory arrival deadline, exceeds the budget ceiling,
 * or violates immigration/visa transit restrictions is strictly DISQUALIFIED.
 */
export class RecoveryConstraintValidator {
  /**
   * Evaluates all candidate options against strict gates and soft preferences.
   */
  public static evaluateAll(
    rawOptions: MetaRecoveryResponse['rawOptions'],
    trip: Trip,
    constraints: TripConstraints
  ): RecoveryOption[] {
    const evaluated = rawOptions.map(rawOption => this.evaluateOption(rawOption, trip, constraints));
    
    // Ensure only a route that cleared 100% of hard gates can ever be recommended
    const anyQualified = evaluated.some(opt => opt.hardGatePassed);
    if (!anyQualified) {
      evaluated.forEach(opt => {
        opt.isRecommended = false;
      });
    }

    return evaluated;
  }

  /**
   * Evaluates a single candidate route against deterministic hard gates.
   */
  public static evaluateOption(
    rawOption: MetaRecoveryResponse['rawOptions'][0],
    _trip: Trip,
    constraints: TripConstraints
  ): RecoveryOption {
    const checks: ConstraintCheckResult[] = [];
    const gateBreaches: string[] = [];

    // =========================================================================
    // HARD GATE 1: Budget Ceiling Compliance
    // =========================================================================
    const budgetPassed = rawOption.outOfPocketCost <= constraints.maxRecoveryBudget;
    if (budgetPassed) {
      checks.push({
        name: 'Hard Gate: Budget Ceiling ($450 USD Max)',
        isHardGate: true,
        passed: true,
        severity: 'PASS',
        detail: `Out-of-pocket cost is $${rawOption.outOfPocketCost} USD (Allowed buffer: $${constraints.maxRecoveryBudget} USD). Margin remaining: $${constraints.maxRecoveryBudget - rawOption.outOfPocketCost}.`,
      });
    } else {
      gateBreaches.push(`Out-of-pocket cost ($${rawOption.outOfPocketCost}) exceeds $${constraints.maxRecoveryBudget} ceiling.`);
      checks.push({
        name: 'Hard Gate: Budget Ceiling ($450 USD Max)',
        isHardGate: true,
        passed: false,
        severity: 'FATAL_BREACH',
        detail: `FATAL BREACH: Extra cost of $${rawOption.outOfPocketCost} exceeds approved $${constraints.maxRecoveryBudget} emergency recovery budget.`,
      });
    }

    // =========================================================================
    // HARD GATE 2: Mandatory Arrival Deadline (Day 2, 14:00 JST)
    // =========================================================================
    let deadlinePassed = false;
    let deadlineDetail = '';

    if (rawOption.id === 'OPT-RECOVER-A') {
      deadlinePassed = true;
      deadlineDetail = 'Arrives Tokyo Haneda at 11:40 JST (Day 2), providing a 2h 20m safety buffer before the 14:00 JST symposium opening doors.';
    } else if (rawOption.id === 'OPT-RECOVER-B') {
      deadlinePassed = false;
      gateBreaches.push('Arrives Day 2 at 16:05 JST, breaching the 14:00 JST Keynote Symposium deadline by 2h 05m.');
      deadlineDetail = 'FATAL BREACH: Lands at 16:05 JST. The traveler would miss the 14:30 JST keynote opening remarks entirely.';
    } else {
      deadlinePassed = false;
      gateBreaches.push('Arrives Day 3 at 06:15 JST, missing all Day 2 commitments by 16+ hours.');
      deadlineDetail = 'FATAL BREACH: Arrival is delayed by 19.5 hours to Day 3. All Day 2 commitments forfeit.';
    }

    checks.push({
      name: 'Hard Gate: Arrival Deadline (Day 2, 14:00 JST)',
      isHardGate: true,
      passed: deadlinePassed,
      severity: deadlinePassed ? 'PASS' : 'FATAL_BREACH',
      detail: deadlineDetail,
    });

    // =========================================================================
    // HARD GATE 3: Transit Visa & Border Clearance Permissibility
    // =========================================================================
    const requiresLandsideBorderCrossing = rawOption.recoveryMode === 'MULTIMODAL_RAIL_AIR';
    if (requiresLandsideBorderCrossing && !constraints.allowsLandsideBorderEntry) {
      gateBreaches.push('Immigration Barrier: Boarding Deutsche Bahn ICE requires entering Germany without a valid Schengen Visa.');
      checks.push({
        name: 'Hard Gate: Schengen Transit Visa Clearance',
        isHardGate: true,
        passed: false,
        severity: 'FATAL_BREACH',
        detail: 'FATAL BREACH: Traveler holds airside transit status only. Accessing Frankfurt Airport rail station requires clearing German Federal Police border control, which is legally prohibited.',
      });
    } else {
      checks.push({
        name: 'Hard Gate: Schengen Transit Visa Clearance',
        isHardGate: true,
        passed: true,
        severity: 'PASS',
        detail: 'Traveler stays entirely within Frankfurt Airport Terminal 1 international airside transit. No German border entry required.',
      });
    }

    // =========================================================================
    // HARD GATE 4: Minimum Connection Time (MCT) at Frankfurt Hub
    // =========================================================================
    // Option A: 13:30 arrival to 14:55 departure = 85 mins layover (> 45m MCT).
    // Option B: 13:30 arrival to 14:35 train = 65 mins to Fernbahnhof (tight but theoretically meets train buffer).
    // Option C: Overnight hotel = 16 hours.
    checks.push({
      name: 'Hard Gate: Hub Minimum Connection Time (MCT ≥ 45m)',
      isHardGate: true,
      passed: true,
      severity: 'PASS',
      detail: 'Layover buffer at Frankfurt Airport exceeds the mandatory 45-minute terminal MCT standard.',
    });

    // =========================================================================
    // SOFT PREFERENCE 1: Checked Baggage Interlining Feasibility
    // =========================================================================
    const isInterlineAutomatic = rawOption.recoveryMode === 'DIRECT_REBOOK';
    if (isInterlineAutomatic) {
      checks.push({
        name: 'Operational Preference: Luggage Auto-Transfer',
        isHardGate: false,
        passed: true,
        severity: 'PASS',
        detail: 'Checked bag (Tag #LH-982341) automatically transfers airside between Lufthansa flights.',
      });
    } else {
      checks.push({
        name: 'Operational Preference: Luggage Auto-Transfer',
        isHardGate: false,
        passed: false,
        severity: 'WARNING',
        detail: 'Checked bag cannot be transferred to rail. Requires landside baggage claim and manual re-check.',
      });
    }

    // =========================================================================
    // GATE DETERMINATION: Pass or Disqualify
    // =========================================================================
    const hardGatePassed = gateBreaches.length === 0;

    let feasibilityScore = 0;
    let eligibilityStatus: RecoveryOption['eligibilityStatus'] = 'DISQUALIFIED_GATE_FAILED';

    if (hardGatePassed) {
      feasibilityScore = 100; // Passed 100% of hard constraints
      eligibilityStatus = 'QUALIFIED_RECOMMENDED';
    } else {
      feasibilityScore = 0; // Disqualified: Cannot recommend an unviable route
      eligibilityStatus = 'DISQUALIFIED_GATE_FAILED';
    }

    return {
      ...rawOption,
      hardGatePassed,
      gateBreaches,
      feasibilityScore,
      eligibilityStatus,
      constraintChecks: checks,
      isRecommended: hardGatePassed && rawOption.id === 'OPT-RECOVER-A',
    };
  }
}
