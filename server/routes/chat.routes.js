import { Router } from 'express';
import { generateChatResponse } from '../services/gemini.service.js';
import { chatValidationRules, handleValidationErrors } from '../middleware/validator.js';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers.js';
import { HTTP_STATUS, APP_CONSTANTS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Chat router — handles AI-powered conversation endpoints.
 * @type {import('express').Router}
 */
const router = Router();

/**
 * POST /api/chat
 * Sends a message to the CarbonWise AI assistant and receives a response.
 *
 * @route POST /api/chat
 * @param {Object} req.body - Request body
 * @param {string} req.body.message - User's chat message (1-2000 chars)
 * @param {Array} [req.body.history] - Previous conversation history
 * @returns {Object} 200 - AI chat response (or 400 on validation error, 500 on server error)
 */
router.post('/', chatValidationRules, handleValidationErrors, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Validate and limit conversation history length
    const sanitizedHistory = Array.isArray(history)
      ? history.slice(-APP_CONSTANTS.MAX_CHAT_HISTORY)
      : [];

    const { response, cached } = await generateChatResponse(message, sanitizedHistory);

    logger.info('Chat response sent', { cached, messagePreview: message.substring(0, 50) });

    res.status(HTTP_STATUS.OK).json(
      createSuccessResponse({
        reply: response,
        cached,
      })
    );
  } catch (error) {
    logger.error('Chat endpoint error', { error: error.message });
    res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(createErrorResponse('Failed to process your message. Please try again.'));
  }
});

export default router;
