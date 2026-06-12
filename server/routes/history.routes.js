import { Router } from 'express';
import { cacheService } from '../services/cache.service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';

const router = Router();

// Store footprint
router.post('/', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['sessionId'];
    if (!sessionId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('Session ID required'));
    }
    
    const { data } = req.body;
    await cacheService.set(`history_${sessionId}`, JSON.stringify(data));
    res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'History saved'));
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('Failed to save history'));
  }
});

// Retrieve footprint
router.get('/', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies['sessionId'];
    if (!sessionId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('Session ID required'));
    }
    
    const data = await cacheService.get(`history_${sessionId}`);
    const parsed = data ? JSON.parse(data) : null;
    res.status(HTTP_STATUS.OK).json(createSuccessResponse({ data: parsed }, 'History retrieved'));
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('Failed to retrieve history'));
  }
});

export default router;
