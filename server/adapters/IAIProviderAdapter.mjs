/**
 * IAIProviderAdapter
 * Standard contract for all AI recovery candidate generators.
 * Guarantees that Groq, Meta, Muse, and the offline test fixture share a normalized request/response format.
 */

export class IAIProviderAdapter {
  constructor(providerId, modelName) {
    this.providerId = providerId;
    this.modelName = modelName;
  }

  /**
   * Returns true if required credentials are configured in the server environment.
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('isConfigured() must be implemented by subclass');
  }

  /**
   * Generates alternative travel recovery candidates.
   * @param {Object} request Normalized recovery request payload
   * @returns {Promise<Object>} Normalized provider response
   */
  async generateRecovery(request) {
    throw new Error('generateRecovery() must be implemented by subclass');
  }
}

