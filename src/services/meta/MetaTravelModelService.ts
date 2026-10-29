import {
  IMetaTravelModelService,
  MetaRecoveryRequest,
  MetaRecoveryResponse,
} from './IMetaTravelModelService';
import { MetaRecoveryTestFixture } from './MetaRecoveryTestFixture';

/**
 * MetaTravelModelService
 * 
 * Cleanly isolated model service interface.
 * Prepares the expected prompt schema and structured output contract.
 * Uses MetaRecoveryTestFixture until official Meta API credits are granted.
 * 
 * STRICT COMPLIANCE:
 * - We do NOT claim Meta model is integrated or live-tested until real credits are active.
 * - We do NOT substitute Groq, Gemini, or other third-party LLMs.
 */
export class MetaTravelModelService implements IMetaTravelModelService {
  private apiKey: string | null = null;
  private endpoint: string = 'https://api.llama-api.com/v1/chat/completions';
  private modelName: string = 'meta-llama/Llama-3.3-70B-Instruct';

  constructor(apiKey?: string, endpoint?: string) {
    if (apiKey) this.apiKey = apiKey;
    if (endpoint) this.endpoint = endpoint;
  }

  public setMetaCredentials(apiKey: string, endpoint?: string) {
    this.apiKey = apiKey.trim() || null;
    if (endpoint && endpoint.trim()) this.endpoint = endpoint.trim();
  }

  public getModelInfo() {
    return {
      modelName: this.modelName,
      endpoint: this.endpoint,
      hasLiveKey: Boolean(this.apiKey),
    };
  }

  /**
   * Generates recovery options for a disrupted traveler.
   */
  public async generateRecoveryPlan(request: MetaRecoveryRequest): Promise<MetaRecoveryResponse> {
    // If no valid Meta API key has been provided yet, use the calibrated test fixture
    if (!this.apiKey) {
      // Simulate realistic model round-trip latency (450ms)
      await new Promise(resolve => setTimeout(resolve, 450));
      return MetaRecoveryTestFixture.getMockResponse(request);
    }

    // REAL META MODEL CALL PIPELINE (Executed when credits are funded)
    try {
      const systemPrompt = `You are RouteX Recovery Engine powered by Meta Llama.
Task: Given a missed connection disruption, generate structured travel recovery alternatives.
Output strictly valid JSON matching the MetaRecoveryResponse schema. Do not output markdown code blocks.`;

      const userPrompt = JSON.stringify({
        tripContext: {
          origin: request.trip.origin,
          destination: request.trip.destination,
          travelerTier: request.trip.travelerTier,
          constraints: request.constraints,
        },
        disruption: {
          location: request.disruption.location,
          delayedSegment: request.disruption.delayedSegmentId,
          missedSegment: request.disruption.missedSegmentId,
          delayMinutes: request.disruption.delayMinutes,
          rootCause: request.disruption.rootCause,
        },
      });

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.choices[0].message.content;
      const parsedContent = JSON.parse(rawText);

      return {
        ...parsedContent,
        modelMetadata: {
          modelName: this.modelName,
          provider: 'Meta Llama (Official)',
          isLiveApiCall: true,
          creditsStatus: 'ACTIVE_KEY_PRESENT',
          statusMessage: `Live Meta API call verified via ${this.modelName}.`,
          disclaimer: 'Live Meta Model Generation Verified.',
          evaluatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.warn('Real Meta model call failed or returned error. Falling back to test fixture.', error);
      const fallback = MetaRecoveryTestFixture.getMockResponse(request);
      fallback.modelMetadata.statusMessage = `Meta API call error (${error instanceof Error ? error.message : 'Unknown'}). Safely operated in test fixture mode.`;
      return fallback;
    }
  }
}

// Export singleton instance
export const metaTravelModelService = new MetaTravelModelService();
