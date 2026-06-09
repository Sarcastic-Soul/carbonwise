import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { createErrorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns a standardized error response.
 * In production, error details are hidden to prevent information leakage.
 * Must have 4 parameters for Express to recognize it as error middleware.
 * @param {any} err - The error object
 * @param {import('express').Request} _req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} _next - Express next function
 */
export function globalErrorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const message = config.isProduction
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  logger.error('Unhandled error', {
    error: err.message,
    stack: config.isProduction ? undefined : err.stack,
    statusCode,
  });

  res.status(statusCode).json(createErrorResponse(message, statusCode));
}

/**
 * Middleware to handle 404 Not Found errors for undefined routes.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export function notFoundHandler(req, res) {
  logger.warn('Route not found', { path: req.originalUrl, method: req.method });
  res
    .status(HTTP_STATUS.NOT_FOUND)
    .json(createErrorResponse('The requested resource was not found.', HTTP_STATUS.NOT_FOUND));
}
