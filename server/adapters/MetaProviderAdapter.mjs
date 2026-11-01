import { IAIProviderAdapter } from './IAIProviderAdapter.mjs';

/**
 * MetaProviderAdapter
 * Secondary AI provider adapter for official Meta Llama endpoint when credentials are supplied.
 */
export class MetaProviderAdapter extends IAIProviderAdapter {
  constructor(apiKey, endpoint) {
    super('meta', 'meta-llama/Llama-3.3-70B-Instruct');
    this.apiKey = apiKey || process.env.META_API_KEY || null;
    this.endpoint = endpoint || process.env.META_API_ENDPOINT || 'https://api.llama-api.com/v1/chat/completions';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateRecovery(request) {
    if (!this.isConfigured()) {
      return {
        providerId: 'meta',
        modelName: this.modelName,
        executionMode: 'UNCONFIGURED_FALLBACK',
        error: 'META_API_KEY not configured in local server .env',
        fallbackRequired: true,
      };
    }

    // Direct endpoint pipeline when configured
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: 'Generate RouteX recovery alternatives JSON.' },
            { role: 'user', content: JSON.stringify(request) },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        return {
          providerId: 'meta',
          modelName: this.modelName,
          executionMode: 'API_ERROR_FALLBACK',
          error: `Meta endpoint returned status ${response.status}`,
          fallbackRequired: true,
        };
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return {
        providerId: 'meta',
        modelName: this.modelName,
        executionMode: 'LIVE_API',
        statusMessage: `Evaluated via Meta Llama API (${this.modelName}).`,
        ...parsed,
      };
    } catch (err) {
      return {
        providerId: 'meta',
        modelName: this.modelName,
        executionMode: 'NETWORK_ERROR_FALLBACK',
        error: err?.message,
        fallbackRequired: true,
      };
    }
  }
}

