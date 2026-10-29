import { Trip, DisruptionEvent, TripConstraints, RecoveryOption } from '../../types/travel';

/**
 * Input contract passed into the Meta model recovery service.
 */
export interface MetaRecoveryRequest {
  trip: Trip;
  disruption: DisruptionEvent;
  constraints: TripConstraints;
  currentLocation: string; // e.g., "Frankfurt Airport (FRA) Terminal 1"
  currentTime: string;     // ISO timestamp of disruption
}

/**
 * Structured output schema returned by the Meta model service.
 */
export interface MetaRecoveryResponse {
  modelMetadata: {
    modelName: string; // e.g. "meta-llama/Llama-3.3-70B-Instruct"
    provider: 'Meta Llama (Official)' | 'Temporary Test Fixture';
    isLiveApiCall: boolean;
    creditsStatus: 'AWAITING_CREDITS' | 'ACTIVE_KEY_PRESENT';
    statusMessage: string;
    disclaimer: string;
    evaluatedAt: string;
  };
  reasoningSummary: string;
  recommendedOptionId: string;
  rawOptions: Omit<
    RecoveryOption,
    'hardGatePassed' | 'gateBreaches' | 'feasibilityScore' | 'eligibilityStatus' | 'constraintChecks' | 'isRecommended'
  >[];
}

/**
 * Isolated Interface for Meta Model Travel Recovery Integration.
 * Strictly decoupled from deterministic constraint validation.
 */
export interface IMetaTravelModelService {
  generateRecoveryPlan(request: MetaRecoveryRequest): Promise<MetaRecoveryResponse>;
}
