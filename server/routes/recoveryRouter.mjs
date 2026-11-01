import { GroqProviderAdapter } from '../adapters/GroqProviderAdapter.mjs';
import { MetaProviderAdapter } from '../adapters/MetaProviderAdapter.mjs';
import { MuseProviderAdapter } from '../adapters/MuseProviderAdapter.mjs';
import { DeterministicFixtureAdapter } from '../adapters/DeterministicFixtureAdapter.mjs';

// Instantiate local singleton adapters
const fixtureAdapter = new DeterministicFixtureAdapter();
const groqAdapter = new GroqProviderAdapter();
const metaAdapter = new MetaProviderAdapter();
const museAdapter = new MuseProviderAdapter();

/**
 * Handles /api/recovery/evaluate requests.
 * @param {Object} body Parsed JSON request payload
 * @returns {Promise<Object>} Formatted recovery response
 */
export async function handleRecoveryEvaluation(body) {
  const requestedProvider = body.requestedProvider || 'groq';

  // 1. Explicit offline / fixture selection
  if (requestedProvider === 'fixture') {
    const fixtureResult = await fixtureAdapter.generateRecovery(body);
    return {
      ...fixtureResult,
      providerId: 'fixture',
      executionMode: 'DETERMINISTIC_FIXTURE',
      notice: 'Explicitly operating in zero-network simulation fixture mode.',
    };
  }

  // 2. Select appropriate provider adapter
  let activeAdapter = groqAdapter;
  if (requestedProvider === 'meta') {
    activeAdapter = metaAdapter;
  } else if (requestedProvider === 'muse') {
    activeAdapter = museAdapter;
  }

  // 3. Attempt live generation if configured
  if (activeAdapter.isConfigured()) {
    const liveResult = await activeAdapter.generateRecovery(body);
    if (!liveResult.fallbackRequired) {
      return liveResult;
    }
    // Live call failed, fall through to transparent fallback
    const fallbackResult = await fixtureAdapter.generateRecovery(body);
    return {
      ...fallbackResult,
      fallbackOccurred: true,
      requestedProvider,
      fallbackReason: liveResult.error || 'Live provider call failed',
      executionMode: 'DETERMINISTIC_FIXTURE',
      statusMessage: `Requested ${requestedProvider} encountered error (${liveResult.error}). Safely operated in calibrated simulation mode.`,
    };
  }

  // 4. Provider not configured with valid API key — transparently inform client and run fixture
  const fixtureResult = await fixtureAdapter.generateRecovery(body);
  return {
    ...fixtureResult,
    fallbackOccurred: true,
    requestedProvider,
    fallbackReason: `No ${requestedProvider.toUpperCase()}_API_KEY configured in server .env`,
    executionMode: 'DETERMINISTIC_FIXTURE',
    statusMessage: `No ${requestedProvider.toUpperCase()}_API_KEY configured. Operating in calibrated offline simulation mode.`,
  };
}

/**
 * Returns server provider readiness telemetry.
 */
export function getProviderTelemetry() {
  return {
    groq: {
      configured: groqAdapter.isConfigured(),
      model: groqAdapter.modelName,
    },
    meta: {
      configured: metaAdapter.isConfigured(),
      model: metaAdapter.modelName,
    },
    muse: {
      configured: museAdapter.isConfigured(),
      model: museAdapter.modelName,
    },
    fixture: {
      configured: true,
      model: fixtureAdapter.modelName,
    },
  };
}

