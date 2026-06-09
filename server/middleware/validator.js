import { body, validationResult } from 'express-validator';
import { createErrorResponse } from '../utils/helpers.js';
import { HTTP_STATUS, APP_CONSTANTS } from '../utils/constants.js';

/**
 * Validation rules for the chat endpoint.
 * Validates and sanitizes the user message before processing.
 * @type {import('express-validator').ValidationChain[]}
 */
export const chatValidationRules = [
  body('message')
    .exists({ checkFalsy: true })
    .withMessage('Message is required.')
    .isString()
    .withMessage('Message must be a string.')
    .trim()
    .isLength({ min: 1, max: APP_CONSTANTS.MAX_MESSAGE_LENGTH })
    .withMessage(
      `Message must be between 1 and ${APP_CONSTANTS.MAX_MESSAGE_LENGTH} characters.`
    )
    .escape(),
];

/**
 * Validation rules for the carbon calculator endpoint.
 * Validates each activity category input.
 * @type {import('express-validator').ValidationChain[]}
 */
export const calculatorValidationRules = [
  body('transport')
    .optional()
    .isObject()
    .withMessage('Transport must be an object.'),
  body('transport.type')
    .optional()
    .isString()
    .trim()
    .escape(),
  body('transport.distance')
    .optional()
    .isFloat({ min: 0, max: 100000 })
    .withMessage('Distance must be a number between 0 and 100,000.'),
  body('transport.frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Frequency must be daily, weekly, monthly, or yearly.'),
  body('energy')
    .optional()
    .isObject()
    .withMessage('Energy must be an object.'),
  body('energy.type')
    .optional()
    .isString()
    .trim()
    .escape(),
  body('energy.amount')
    .optional()
    .isFloat({ min: 0, max: 100000 })
    .withMessage('Amount must be a number between 0 and 100,000.'),
  body('diet')
    .optional()
    .isString()
    .trim()
    .escape(),
  body('shopping')
    .optional()
    .isObject()
    .withMessage('Shopping must be an object.'),
  body('shopping.type')
    .optional()
    .isString()
    .trim()
    .escape(),
  body('shopping.quantity')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Quantity must be an integer between 0 and 1,000.'),
];

/**
 * Middleware that checks for validation errors from preceding validation rules.
 * If errors are found, returns a 400 response with detailed error messages.
 * If no errors, passes control to the next middleware.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      createErrorResponse('Validation failed. Please check your input.', HTTP_STATUS.BAD_REQUEST)
    );
  }

  next();
}
