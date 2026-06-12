import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { config } from '../config/environment.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { createErrorResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  logger.info('Redis initialized for rate limiting.');
}

/**
 * Creates a rate limiter middleware to prevent abuse and brute-force attacks.
 * Limits the number of requests a single IP can make within a time window.
 * @returns {import('express').RequestHandler} Configured rate limiter middleware
 */
export function createRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
    message: createErrorResponse(
      'Too many requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    ),
    keyGenerator: (req) => {
      const sessionId = req.headers['x-session-id'];
      if (sessionId) {
        return Array.isArray(sessionId) ? sessionId[0] : sessionId;
      }
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      return Array.isArray(ip) ? ip[0] : ip;
    },
  });
}

/**
 * Creates a stricter rate limiter specifically for AI chat endpoints.
 * AI calls are expensive, so they get a tighter limit.
 * @returns {import('express').RequestHandler} Configured rate limiter for AI endpoints
 */
export function createAiRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: Math.floor(config.rateLimit.maxRequests / 2),
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }) : undefined,
    message: createErrorResponse(
      'AI request limit reached. Please wait before sending more messages.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    ),
    keyGenerator: (req) => {
      const sessionId = req.headers['x-session-id'];
      if (sessionId) {
        return Array.isArray(sessionId) ? sessionId[0] : sessionId;
      }
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      return Array.isArray(ip) ? ip[0] : ip;
    },
  });
}
