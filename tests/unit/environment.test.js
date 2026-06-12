import { jest } from '@jest/globals';

describe('Environment Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should throw an error if GEMINI_API_KEY is missing', async () => {
    // Save original env
    const originalEnv = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    
    const { validateConfig } = await import('../../server/config/environment.js');
    expect(() => validateConfig()).toThrow('GEMINI_API_KEY is required');
    
    // Restore
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it('should not throw if GEMINI_API_KEY is present', async () => {
    const originalEnv = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    
    const { validateConfig } = await import('../../server/config/environment.js');
    expect(() => validateConfig()).not.toThrow();
    
    process.env.GEMINI_API_KEY = originalEnv;
  });
});
