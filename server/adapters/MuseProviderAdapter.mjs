import { IAIProviderAdapter } from './IAIProviderAdapter.mjs';

/**
 * MuseProviderAdapter
 * Dedicated adapter for Muse API when configured.
 */
export class MuseProviderAdapter extends IAIProviderAdapter {
  constructor(apiKey, endpoint) {
    super('muse', 'muse-travel-v1');
    this.apiKey = apiKey || process.env.MUSE_API_KEY || null;
    this.endpoint = endpoint || process.env.MUSE_API_ENDPOINT || 'https://api.muse.ai/v1/generate';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateRecovery(request) {
    if (!this.isConfigured()) {
      return {
        providerId: 'muse',
        modelName: this.modelName,
        executionMode: 'UNCONFIGURED_FALLBACK',
        error: 'MUSE_API_KEY not configured in local server .env',
        fallbackRequired: true,
      };
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey.trim()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return {
          providerId: 'muse',
          modelName: this.modelName,
          executionMode: 'API_ERROR_FALLBACK',
          error: `Muse endpoint returned status ${response.status}`,
          fallbackRequired: true,
        };
      }

      const data = await response.json();
      return {
        providerId: 'muse',
        modelName: this.modelName,
        executionMode: 'LIVE_API',
        statusMessage: `Evaluated via Muse API (${this.modelName}).`,
        ...data,
      };
    } catch (err) {
      return {
        providerId: 'muse',
        modelName: this.modelName,
        executionMode: 'NETWORK_ERROR_FALLBACK',
        error: err?.message,
        fallbackRequired: true,
      };
    }
  }
}

