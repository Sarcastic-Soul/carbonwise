import dotenv from 'dotenv';

// Load environment variables from .env file in non-production environments
dotenv.config();

/**
 * Centralized application configuration.
 * All environment-dependent values are sourced from environment variables
 * with sensible defaults for development.
 */
export const config = Object.freeze({
  /** @type {number} Server port */
  port: parseInt(process.env.PORT, 10) || 8080,

  /** @type {string} Current environment (development, production, test) */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** @type {boolean} Whether the app is running in production */
  isProduction: process.env.NODE_ENV === 'production',

  /** @type {string} Gemini API key for AI integration */
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  /** @type {string} Gemini model identifier */
  geminiModel: 'gemini-3.1-flash-lite',

  /** @type {Object} Rate limiting configuration */
  rateLimit: Object.freeze({
    /** @type {number} Time window in milliseconds (default: 15 minutes) */
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    /** @type {number} Maximum requests per window */
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  }),

  /** @type {Object} Cache configuration */
  cache: Object.freeze({
    /** @type {number} Maximum cache entries */
    maxSize: 100,
    /** @type {number} Time-to-live in milliseconds (default: 30 minutes) */
    ttl: 1800000,
  }),
});

/**
 * Validates that all required configuration values are present.
 * Throws an error if any required value is missing.
 * @throws {Error} If GEMINI_API_KEY is not set
 */
export function validateConfig() {
  if (!config.geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is required. Set it in your .env file or environment variables.'
    );
  }
}
