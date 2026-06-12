/**
 * Unit tests for environment configuration validation.
 * Tests that validateConfig enforces required environment variables.
 */

describe('Environment Configuration', () => {
  /** @type {string|undefined} */
  let originalKey;

  beforeEach(() => {
    originalKey = process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    // Restore the original environment variable
    if (originalKey !== undefined) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  it('should correctly enforce the GEMINI_API_KEY requirement', async () => {
    // Import the environment config. Since we use ESM and Jest, the module 
    // is cached and Object.freeze is already applied.
    const { config, validateConfig } = await import('../../server/config/environment.js');

    // Dynamically test the validateConfig function based on the actual 
    // frozen state of the config object at the time of execution.
    if (!config.geminiApiKey) {
      // If the key is missing in this cached state, it MUST throw.
      expect(() => validateConfig()).toThrow('GEMINI_API_KEY is required');
    } else {
      // If the key is present (from .env or global test setup), it MUST NOT throw.
      expect(() => validateConfig()).not.toThrow();
    }
  });
});
