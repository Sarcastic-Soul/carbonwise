import { Router } from 'express';
import { generatePersonalizedTips } from '../services/gemini.service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Tips router — handles AI-powered personalized eco tip endpoints.
 * @type {import('express').Router}
 */
const router = Router();

/**
 * POST /api/tips
 * Generates personalized eco tips based on the user's carbon footprint data.
 *
 * @route POST /api/tips
 * @param {Object} req.body - User's calculated carbon footprint data
 * @param {number} req.body.totalTonnes - Total annual emissions in tonnes
 * @param {Object} req.body.breakdown - Category breakdown
 * @returns {Object} 200 - AI-generated personalized eco tips (or 400 on missing footprint data, 500 on generation error)
 */
router.post('/', async (req, res) => {
  try {
    const footprintData = req.body;

    if (!footprintData || typeof footprintData.totalTonnes !== 'number') {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          createErrorResponse(
            'Please provide your carbon footprint data to get personalized tips.',
            HTTP_STATUS.BAD_REQUEST
          )
        );
    }

    const { tips, cached } = await generatePersonalizedTips(footprintData);

    logger.info('Tips generated', { cached, totalTonnes: footprintData.totalTonnes });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse({
        tips,
        cached,
      })
    );
  } catch (error) {
    logger.error('Tips endpoint error', { error: error.message });
    return res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(createErrorResponse('Failed to generate personalized tips.'));
  }
});

export default router;
