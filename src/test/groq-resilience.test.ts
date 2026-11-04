import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqProviderAdapter } from '../../server/adapters/GroqProviderAdapter.mjs';

describe('GroqProviderAdapter - Server-Side Resilience & Mock Scenarios', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const dummyRequest = {
    trip: { origin: 'LHR', destination: 'FRA', travelerTier: 'Gold' },
    disruption: { location: 'FRA', delayMinutes: 75, rootCause: 'De-icing' },
    constraints: { maxRecoveryBudget: 400 },
  };

  it('1. Missing / unconfigured key returns UNCONFIGURED_FALLBACK safely', async () => {
    const adapter = new GroqProviderAdapter('', 'llama-3.3-70b-versatile');
    // Ensure key is empty
    adapter.apiKey = null;

    const res = await adapter.generateRecovery(dummyRequest);
    expect(res.executionMode).toBe('UNCONFIGURED_FALLBACK');
    expect(res.fallbackRequired).toBe(true);
    expect(res.error).toContain('not configured');
  });

  it('2. Request timeout (AbortError) returns NETWORK_ERROR_FALLBACK without crashing', async () => {
    const adapter = new GroqProviderAdapter('gsk-test-dummy-key', 'llama-3.3-70b-versatile');

    globalThis.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const res = await adapter.generateRecovery(dummyRequest);
    expect(res.executionMode).toBe('NETWORK_ERROR_FALLBACK');
    expect(res.fallbackRequired).toBe(true);
    expect(res.error).toContain('aborted');
  });

  it('3. HTTP 429 Rate Limit returns API_ERROR_FALLBACK with status 429', async () => {
    const adapter = new GroqProviderAdapter('gsk-test-dummy-key', 'llama-3.3-70b-versatile');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded: TPM quota reached',
    });

    const res = await adapter.generateRecovery(dummyRequest);
    expect(res.executionMode).toBe('API_ERROR_FALLBACK');
    expect(res.fallbackRequired).toBe(true);
    expect(res.error).toContain('429');
  });

  it('4. HTTP 500 / 503 Server Error returns API_ERROR_FALLBACK gracefully', async () => {
    const adapter = new GroqProviderAdapter('gsk-test-dummy-key', 'llama-3.3-70b-versatile');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    const res = await adapter.generateRecovery(dummyRequest);
    expect(res.executionMode).toBe('API_ERROR_FALLBACK');
    expect(res.fallbackRequired).toBe(true);
    expect(res.error).toContain('503');
  });

  it('5. Malformed JSON payload is caught safely without unhandled exceptions', async () => {
    const adapter = new GroqProviderAdapter('gsk-test-dummy-key', 'llama-3.3-70b-versatile');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        // Returns content string with broken JSON
        return {
          choices: [{ message: { content: '{ "brokenJson": true, ' } }],
        };
      },
    });

    const res = await adapter.generateRecovery(dummyRequest);
    expect(res.executionMode).toBe('NETWORK_ERROR_FALLBACK');
    expect(res.fallbackRequired).toBe(true);
  });

  it('6. Valid structured response returns LIVE_API with candidate routes', async () => {
    const adapter = new GroqProviderAdapter('gsk-test-dummy-key', 'llama-3.3-70b-versatile');

    const validPayload = {
      reasoningSummary: 'Candidate direct flight rebooked via ANA.',
      recommendedOptionId: 'OPT-RECOVER-A',
      rawOptions: [
        {
          id: 'OPT-RECOVER-A',
          title: 'ANA Direct Rebook',
          subtitle: '[AI-proposed, availability unverified]',
          recoveryMode: 'DIRECT_REBOOK',
          carrierSummary: 'ANA • Flight NH 224',
          outOfPocketCost: 0,
          totalDelayHours: 1.2,
          finalArrivalTime: 'Day 2, 11:40 JST',
          assumptions: [],
          nextSteps: [],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(validPayload) } }],
      }),
    });

    const res = await adapter.generateRecovery(dummyRequest);
    expect(res.executionMode).toBe('LIVE_API');
    expect(res.fallbackRequired).toBeFalsy();
    expect(res.rawOptions.length).toBe(1);
    expect(res.rawOptions[0].title).toBe('ANA Direct Rebook');
    expect(res.reasoningSummary).toBe('Candidate direct flight rebooked via ANA.');
  });
});

