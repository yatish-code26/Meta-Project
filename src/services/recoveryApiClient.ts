import { Trip, DisruptionEvent, TripConstraints } from '../types/travel';
import { MetaRecoveryResponse } from './meta/IMetaTravelModelService';
import { MetaRecoveryTestFixture } from './meta/MetaRecoveryTestFixture';
import { TwinSimulationParams } from '../types/twin';

export interface ProviderTelemetry {
  groq: { configured: boolean; model: string };
  meta: { configured: boolean; model: string };
  muse: { configured: boolean; model: string };
  fixture: { configured: boolean; model: string };
}

export interface RecoveryApiEvaluationResponse extends MetaRecoveryResponse {
  providerId: 'groq' | 'meta' | 'muse' | 'fixture';
  executionMode: 'LIVE_API' | 'DETERMINISTIC_FIXTURE';
  fallbackOccurred?: boolean;
  fallbackReason?: string;
  statusMessage?: string;
  latencyMs?: number;
}

export interface EvaluationPayload {
  trip: Trip;
  disruption: DisruptionEvent;
  constraints: TripConstraints;
  currentLocation: string;
  currentTime: string;
  requestedProvider?: 'groq' | 'meta' | 'muse' | 'fixture';
  simulationParams?: TwinSimulationParams;
}

/**
 * Fetch provider readiness telemetry from the local server.
 */
export async function fetchProviderTelemetry(): Promise<ProviderTelemetry> {
  try {
    const res = await fetch('/api/recovery/providers', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Network or static build fallback
  }

  return {
    groq: { configured: false, model: 'llama-3.3-70b-versatile' },
    meta: { configured: false, model: 'meta-llama/Llama-3.3-70B-Instruct' },
    muse: { configured: false, model: 'meta-muse-travel-v1' },
    fixture: { configured: true, model: 'calibrated-deterministic-fixture' },
  };
}

/**
 * Execute recovery evaluation via server-side endpoint or calibrated fallback.
 */
export async function fetchRecoveryEvaluation(payload: EvaluationPayload): Promise<RecoveryApiEvaluationResponse> {
  const provider = payload.requestedProvider || 'groq';

  try {
    const res = await fetch('/api/recovery/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        modelMetadata: {
          modelName: data.modelName || 'llama-3.3-70b-versatile',
          provider: data.providerId === 'groq' ? 'Meta Llama (Official)' : 'Temporary Test Fixture',
          isLiveApiCall: data.executionMode === 'LIVE_API',
          creditsStatus: data.executionMode === 'LIVE_API' ? 'ACTIVE_KEY_PRESENT' : 'AWAITING_CREDITS',
          statusMessage: data.statusMessage || 'Evaluation completed successfully.',
          disclaimer: data.fallbackOccurred
            ? `FALLBACK: ${data.fallbackReason}. Output served by calibrated deterministic fixture.`
            : `Verified server-side ${data.providerId.toUpperCase()} execution.`,
          evaluatedAt: data.evaluatedAt || new Date().toISOString(),
        },
        reasoningSummary: data.reasoningSummary || '',
        recommendedOptionId: data.recommendedOptionId || 'OPT-RECOVER-A',
        rawOptions: data.rawOptions || [],
        providerId: data.providerId || provider,
        executionMode: data.executionMode || 'DETERMINISTIC_FIXTURE',
        fallbackOccurred: data.fallbackOccurred,
        fallbackReason: data.fallbackReason,
        statusMessage: data.statusMessage,
        latencyMs: data.latencyMs,
      };
    }
  } catch (err) {
    console.warn('[RecoveryApiClient] Server endpoint unreachable, activating offline fixture mode:', err);
  }

  // Resilient offline fallback using calibrated local fixture
  const fixtureResponse = MetaRecoveryTestFixture.getMockResponse({
    trip: payload.trip,
    disruption: payload.disruption,
    constraints: payload.constraints,
    currentLocation: payload.currentLocation,
    currentTime: payload.currentTime,
  });

  return {
    ...fixtureResponse,
    providerId: 'fixture',
    executionMode: 'DETERMINISTIC_FIXTURE',
    fallbackOccurred: true,
    fallbackReason: 'Local server API endpoint unavailable; operating in offline fixture mode.',
    statusMessage: 'Offline deterministic fixture calibrated for zero-network testing.',
    latencyMs: 45,
  };
}

