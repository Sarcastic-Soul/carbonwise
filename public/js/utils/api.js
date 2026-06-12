/**
 * API utility module.
 * Provides a centralized fetch wrapper with error handling,
 * timeout support, and consistent response parsing.
 * @module api
 */

/** @type {number} Default request timeout in milliseconds */
const DEFAULT_TIMEOUT = 30000;

/**
 * Makes an HTTP request to the API with error handling and timeout.
 * @param {string} endpoint - API endpoint path (e.g., '/api/chat')
 * @param {Object} [options={}] - Fetch options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.body] - Request body (will be JSON-stringified)
 * @param {number} [options.timeout] - Request timeout in milliseconds
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} On network errors, timeouts, or non-OK responses
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, timeout = DEFAULT_TIMEOUT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem('sessionId', sessionId);
    }

    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Session-ID': sessionId,
      },
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sends a chat message to the AI assistant.
 * @param {string} message - User's message
 * @param {Array} [history=[]] - Conversation history
 * @returns {Promise<Object>} Chat response data
 */
export async function sendChatMessage(message, history = []) {
  return apiRequest('/api/chat', {
    method: 'POST',
    body: { message, history },
  });
}

/**
 * Submits activity data for carbon footprint calculation.
 * @param {Object} activities - Activity data for each category
 * @returns {Promise<Object>} Calculated footprint data
 */
export async function calculateFootprint(activities) {
  return apiRequest('/api/calculator', {
    method: 'POST',
    body: activities,
  });
}

/**
 * Fetches available emission factor options for the calculator.
 * @returns {Promise<Object>} Available emission factors
 */
export async function getEmissionFactors() {
  return apiRequest('/api/calculator/factors');
}

/**
 * Requests personalized eco tips based on footprint data.
 * @param {Object} footprintData - Calculated footprint data
 * @returns {Promise<Object>} Personalized tips
 */
export async function getPersonalizedTips(footprintData) {
  return apiRequest('/api/tips', {
    method: 'POST',
    body: footprintData,
  });
}
