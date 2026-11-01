import { Trip, TripConstraints, RecoveryOption } from '../../types/travel';
import { MetaRecoveryResponse } from '../meta/IMetaTravelModelService';
import { DeterministicConstraintEngine } from './DeterministicConstraintEngine';
import { TwinSimulationParams } from '../../types/twin';

/**
 * Deterministic Constraint Validation Engine (Facade)
 * Maintains backwards compatibility with original RecoveryConstraintValidator signature
 * while delegating dynamic evaluation to DeterministicConstraintEngine.
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

    return DeterministicConstraintEngine.evaluateCandidates(rawOptions, trip, params);
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
