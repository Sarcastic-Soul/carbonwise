import { Router } from 'express';
import {
  calculateTotalFootprint,
  getAvailableFactors,
} from '../services/carbon.service.js';
import { calculatorValidationRules, handleValidationErrors } from '../middleware/validator.js';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Calculator router — handles carbon footprint calculation endpoints.
 * @type {import('express').Router}
 */
const router = Router();

/**
 * POST /api/calculator
 * Calculates a comprehensive carbon footprint based on user activities.
 *
 * @route POST /api/calculator
 * @param {Object} req.body - Activity data for calculation
 * @param {Object} [req.body.transport] - Transportation activity
 * @param {Object} [req.body.energy] - Energy usage
 * @param {string} [req.body.diet] - Diet type
 * @param {Object} [req.body.shopping] - Shopping habits
 * @returns {Object} 200 - Calculated footprint with breakdown and equivalencies
 * @returns {Object} 400 - Validation error
 */
router.post('/', calculatorValidationRules, handleValidationErrors, async (req, res) => {
  try {
    const activities = req.body;
    const result = calculateTotalFootprint(activities);

    logger.info('Footprint calculated', {
      totalTonnes: result.totalTonnes,
      categories: Object.keys(result.breakdown).filter((k) => result.breakdown[k] !== null),
    });

    res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Carbon footprint calculated successfully.'));
  } catch (error) {
    logger.error('Calculator endpoint error', { error: error.message });
    res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(createErrorResponse('Failed to calculate carbon footprint.'));
  }
});

/**
 * GET /api/calculator/factors
 * Returns all available emission factor categories and their options.
 * Used by the frontend to populate calculator dropdowns.
 *
 * @route GET /api/calculator/factors
 * @returns {Object} 200 - Available emission factors by category
 */
router.get('/factors', (_req, res) => {
  try {
    const factors = getAvailableFactors();
    res.status(HTTP_STATUS.OK).json(createSuccessResponse(factors, 'Emission factors retrieved.'));
  } catch (error) {
    logger.error('Factors endpoint error', { error: error.message });
    res
      .status(HTTP_STATUS.INTERNAL_ERROR)
      .json(createErrorResponse('Failed to retrieve emission factors.'));
  }
});

export default router;
