import { config } from '../config/environment.js';

/**
 * Log levels ordered by severity.
 * @enum {number}
 */
const LOG_LEVELS = Object.freeze({
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
});

/**
 * Current log level based on environment.
 * In production, only ERROR and WARN are logged.
 * In development, all levels are logged.
 * @type {number}
 */
const currentLevel = config.isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

/**
 * Formats a log entry as a structured JSON string.
 * @param {string} level - The log level (ERROR, WARN, INFO, DEBUG)
 * @param {string} message - The log message
 * @param {Object} [meta={}] - Additional metadata to include in the log entry
 * @returns {string} Formatted JSON log entry
 */
function formatLogEntry(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
}

/**
 * Structured logger with level-based filtering.
 * Uses JSON format for production compatibility with log aggregation services.
 * @namespace
 */
export const logger = Object.freeze({
  /**
   * Logs an error message. Always logged in all environments.
   * @param {string} message - Error description
   * @param {Object} [meta={}] - Additional context (e.g., error stack, request ID)
   */
  error(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatLogEntry('ERROR', message, meta));
    }
  },

  /**
   * Logs a warning message. Logged in production and development.
   * @param {string} message - Warning description
   * @param {Object} [meta={}] - Additional context
   */
  warn(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLogEntry('WARN', message, meta));
    }
  },

  /**
   * Logs an informational message. Logged in development only.
   * @param {string} message - Info description
   * @param {Object} [meta={}] - Additional context
   */
  info(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.info(formatLogEntry('INFO', message, meta));
    }
  },

  /**
   * Logs a debug message. Logged in development only.
   * @param {string} message - Debug description
   * @param {Object} [meta={}] - Additional context
   */
  debug(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatLogEntry('DEBUG', message, meta));
    }
  },
});
