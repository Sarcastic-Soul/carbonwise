/**
 * Shared helper functions used across the application.
 * All functions are pure — no side effects or external dependencies.
 * @module helpers
 */

/**
 * Sanitizes a string by removing HTML tags and trimming whitespace.
 * Prevents XSS by stripping any HTML content from user inputs.
 * @param {string} input - The raw input string
 * @returns {string} Sanitized string with HTML tags removed
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncates a string to the specified maximum length.
 * Appends an ellipsis if the string is truncated.
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} The truncated string
 */
export function truncateString(text, maxLength) {
  if (typeof text !== 'string' || text.length <= maxLength) {
    return text || '';
  }
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} value - The number to round
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {number} The rounded number
 */
export function roundTo(value, decimals = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Converts kilograms to tonnes.
 * @param {number} kg - Value in kilograms
 * @returns {number} Value in tonnes (rounded to 2 decimal places)
 */
export function kgToTonnes(kg) {
  return roundTo(kg / 1000);
}

/**
 * Converts tonnes to kilograms.
 * @param {number} tonnes - Value in tonnes
 * @returns {number} Value in kilograms
 */
export function tonnesToKg(tonnes) {
  return roundTo(tonnes * 1000, 0);
}

/**
 * Creates a standardized API success response object.
 * @param {*} data - The response data payload
 * @param {string} [message='Success'] - A human-readable message
 * @returns {{success: boolean, message: string, data: *}} Standardized response
 */
export function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Creates a standardized API error response object.
 * Ensures no sensitive information is leaked in error responses.
 * @param {string} message - A user-safe error message
 * @param {number} [statusCode=500] - HTTP status code
 * @returns {{success: boolean, error: {message: string, statusCode: number}}} Standardized error response
 */
export function createErrorResponse(message, statusCode = 500) {
  return {
    success: false,
    error: {
      message,
      statusCode,
    },
  };
}

/**
 * Validates that a value is a positive finite number.
 * @param {*} value - The value to validate
 * @returns {boolean} True if the value is a positive finite number
 */
export function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Generates a simple unique identifier for request tracking.
 * Not cryptographically secure — used only for log correlation.
 * @returns {string} A unique identifier string
 */
export function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`;
}
