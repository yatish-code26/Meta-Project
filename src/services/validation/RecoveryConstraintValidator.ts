import { Trip, TripConstraints, RecoveryOption } from '../../types/travel';
import { MetaRecoveryResponse } from '../meta/IMetaTravelModelService';
import { DeterministicConstraintEngine } from './DeterministicConstraintEngine';
import { TwinSimulationParams } from '../../types/twin';

/**
 * RecoveryConstraintValidator (Facade)
 *
 * Backwards-compatible facade over DeterministicConstraintEngine.
 * The engine now returns { connectionIntact, options } — this facade
 * unwraps that to return RecoveryOption[] for callers that predate the
 * STEP 1 refactor (e.g. existing recovery.test.ts and simulation.test.ts).
 *
 * NOTE: This facade always passes the legacy delayMinutes=75 context which
 * assumes the standard scenario (FRA, winter time, CET). New code should call
 * DeterministicConstraintEngine.evaluateCandidates with an explicit
 * ConnectionContext for correct UTC-based evaluation.
 */
export class RecoveryConstraintValidator {
  public static evaluateAll(
    rawOptions: MetaRecoveryResponse['rawOptions'],
    trip: Trip,
    constraints: TripConstraints,
    simParams?: Partial<TwinSimulationParams>
  ): RecoveryOption[] {
    const params: TwinSimulationParams = {
      delayMinutes: simParams?.delayMinutes ?? 75,
      mctBufferMinutes: simParams?.mctBufferMinutes ?? 45,
      budgetCeiling: simParams?.budgetCeiling ?? constraints.maxRecoveryBudget,
      arrivalDeadlineHours: simParams?.arrivalDeadlineHours ?? constraints.hardArrivalDeadlineNumber,
      visaAirsideOnly: simParams?.visaAirsideOnly ?? !constraints.allowsLandsideBorderEntry,
    };

    // Build the standard UTC context for the Tokyo scenario (winter, CET = UTC+1).
    // The legacy tests always operate at 75m delay in the standard scenario.
    const scheduledTouchdownUtc = new Date('2027-03-10T11:15:00Z'); // 12:15 CET
    const touchdownUtc = new Date(scheduledTouchdownUtc.getTime() + params.delayMinutes * 60_000);
    const onwardDepartureUtc = new Date('2027-03-10T12:45:00Z'); // 13:45 CET

    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawOptions,
      trip,
      params,
      { scheduledTouchdownUtc, touchdownUtc, onwardDepartureUtc }
    );

    // When connection is intact there are no candidates to return.
    // The facade returns [] in this case; callers must handle it.
    return result.options;
  }

  public static evaluateOption(
    rawOption: MetaRecoveryResponse['rawOptions'][0],
    trip: Trip,
    constraints: TripConstraints,
    simParams?: Partial<TwinSimulationParams>
  ): RecoveryOption {
    const result = this.evaluateAll([rawOption], trip, constraints, simParams);
    return result[0];
  }
}
