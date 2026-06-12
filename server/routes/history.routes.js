/**
 * History router — manages persistent storage of user carbon footprint calculations.
 * Uses session-based identification to store/retrieve footprint history via the cache layer.
 * @module history.routes
 */

import { Router } from 'express';
import { cacheService } from '../services/cache.service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * History router — handles session-scoped footprint persistence.
 * @type {import('express').Router}
 */
const router = Router();

/**
 * Extracts the session identifier from request headers or cookies.
 * @param {import('express').Request} req - Express request object
 * @returns {string|undefined} The session ID, or undefined if not present
 */
function getSessionId(req) {
  return req.headers['x-session-id'] || req.cookies?.['sessionId'];
}

/**
 * POST /api/history
 * Persists a user's carbon footprint calculation to session-scoped storage.
 *
 * @route POST /api/history
 * @param {Object} req.body - Request body
 * @param {Object} req.body.data - The footprint data to persist
 * @returns {Object} 200 - Success confirmation (or 400 if session ID is missing)
 */
router.post('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(createErrorResponse('Session ID required.', HTTP_STATUS.BAD_REQUEST));
    }

    const { data } = req.body;
    await cacheService.set(`history_${sessionId}`, JSON.stringify(data));

    logger.info('Footprint history saved', { sessionId });
    return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'History saved.'));
  } catch (error) {
    logger.error('Failed to save footprint history', { error: error.message });
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(createErrorResponse('Failed to save history.'));
  }
});

/**
 * GET /api/history
 * Retrieves a user's most recently saved carbon footprint data.
 *
 * @route GET /api/history
 * @returns {Object} 200 - The stored footprint data (or null if none exists)
 */
router.get('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(createErrorResponse('Session ID required.', HTTP_STATUS.BAD_REQUEST));
    }

    const data = await cacheService.get(`history_${sessionId}`);
    const parsed = data ? JSON.parse(data) : null;

    logger.info('Footprint history retrieved', { sessionId, found: parsed !== null });
    return res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse({ data: parsed }, 'History retrieved.'));
  } catch (error) {
    logger.error('Failed to retrieve footprint history', { error: error.message });
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(createErrorResponse('Failed to retrieve history.'));
  }
});

export default router;
