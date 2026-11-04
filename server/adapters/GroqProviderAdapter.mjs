import { IAIProviderAdapter } from './IAIProviderAdapter.mjs';

/**
 * GroqProviderAdapter
 * Primary AI candidate route generator.
 * Runs strictly on the server side using GROQ_API_KEY from environment.
 * Never exposes keys or sends PII.
 */
export class GroqProviderAdapter extends IAIProviderAdapter {
  constructor(apiKey, modelName = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b') {
    super('groq', modelName);
    this.apiKey = apiKey || process.env.GROQ_API_KEY || null;
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateRecovery(request) {
    if (!this.isConfigured()) {
      return {
        providerId: 'groq',
        modelName: this.modelName,
        executionMode: 'UNCONFIGURED_FALLBACK',
        error: 'GROQ_API_KEY not configured in local server .env',
        fallbackRequired: true,
      };
    }

    const startTime = Date.now();

    const systemPrompt = `You are RouteX Recovery Engine.
Your task: Analyze an air travel disruption (missed connection) and return a structured JSON response containing 3 candidate recovery pathways.
Return strictly valid JSON matching this schema:
{
  "reasoningSummary": "string",
  "recommendedOptionId": "string",
  "rawOptions": [
    {
      "id": "OPT-RECOVER-A",
      "title": "string",
      "subtitle": "string",
      "recoveryMode": "DIRECT_REBOOK" | "MULTIMODAL_RAIL_AIR" | "OVERNIGHT_REST",
      "carrierSummary": "string",
      "newSegments": [
        {
          "id": "string",
          "type": "flight" | "train" | "hotel",
          "code": "string",
          "title": "string",
          "carrier": "string",
          "departureLocation": "string",
          "arrivalLocation": "string",
          "departureTime": "HH:mm",
          "departureTimeZone": "string",
          "arrivalTime": "HH:mm (Day X)",
          "arrivalTimeZone": "string",
          "duration": "string",
          "dayNumber": 1,
          "status": "scheduled",
          "notes": "string"
        }
      ],
      "estimatedTotalCost": 0,
      "airlineCoveredAmount": 1240,
      "outOfPocketCost": 0,
      "finalArrivalTime": "Day 2, 11:40 JST",
      "totalDelayHours": 0.83,
      "tradeOffSummary": "string",
      "assumptions": [
        {
          "id": "string",
          "category": "ASSUMPTION" | "UNVERIFIED_DATA",
          "title": "string",
          "detail": "string",
          "riskLevel": "LOW" | "MEDIUM" | "HIGH",
          "verificationAction": "string"
        }
      ],
      "nextSteps": [
        {
          "stepNumber": 1,
          "location": "string",
          "action": "string",
          "mandatory": true
        }
      ]
    }
  ]
}
Do NOT wrap in markdown backticks. Return raw JSON only.`;

    // Strip any potential traveler PII before sending
    const sanitizedContext = {
      trip: {
        origin: request.trip?.origin,
        destination: request.trip?.destination,
        travelerTier: request.trip?.travelerTier,
      },
      disruption: {
        location: request.disruption?.location,
        delayMinutes: request.disruption?.delayMinutes,
        rootCause: request.disruption?.rootCause,
      },
      constraints: request.constraints,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.endpoint, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(sanitizedContext) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 2500,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GROQ_ERROR] status=${response.status} response=${errorText}`);
        return {
          providerId: 'groq',
          modelName: this.modelName,
          executionMode: 'API_ERROR_FALLBACK',
          error: `Groq API responded with status ${response.status}`,
          fallbackRequired: true,
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      return {
        providerId: 'groq',
        modelName: this.modelName,
        executionMode: 'LIVE_API',
        latencyMs: Date.now() - startTime,
        evaluatedAt: new Date().toISOString(),
        statusMessage: `Evaluated via Groq Llama 3.3 (${this.modelName}).`,
        reasoningSummary: parsed.reasoningSummary,
        recommendedOptionId: parsed.recommendedOptionId || 'OPT-RECOVER-A',
        rawOptions: parsed.rawOptions || [],
      };
    } catch (err) {
      console.error('[GROQ_FETCH_EXCEPTION]', err?.message);
      return {
        providerId: 'groq',
        modelName: this.modelName,
        executionMode: 'NETWORK_ERROR_FALLBACK',
        error: err?.message || 'Network error communicating with Groq',
        fallbackRequired: true,
      };
    }
  }
}
