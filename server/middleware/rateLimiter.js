import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { config } from '../config/environment.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { createErrorResponse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/** @type {import('ioredis').Redis|undefined} Shared Redis client for distributed rate limiting */
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  logger.info('Redis initialized for rate limiting.');
}

/**
 * Extracts a stable client identifier for rate limiting.
 * Prefers the X-Session-ID header for session-based tracking,
 * falls back to client IP address.
 * @param {import('express').Request} req - Express request object
 * @returns {string} A unique key identifying the client
 */
function extractClientKey(req) {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    return Array.isArray(sessionId) ? sessionId[0] : sessionId;
  }
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  return Array.isArray(ip) ? ip[0] : ip;
}

/**
 * Builds a RedisStore instance if a Redis client is available.
 * Returns undefined to let express-rate-limit use its default MemoryStore.
 * @returns {RedisStore|undefined} A RedisStore backed by the shared client, or undefined
 */
function buildStore() {
  if (!redisClient) {
    return undefined;
  }
  return new RedisStore({
    // @ts-expect-error - ioredis call returns unknown, rate-limit-redis expects RedisReply
    sendCommand: (...args) => redisClient.call(...args),
  });
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
    store: buildStore(),
    message: createErrorResponse(
      'Too many requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    ),
    keyGenerator: extractClientKey,
  });
}

/**
 * Creates a stricter rate limiter specifically for AI chat endpoints.
 * AI calls are expensive (Gemini API), so they get a tighter limit
 * (half the general window maximum).
 * @returns {import('express').RequestHandler} Configured rate limiter for AI endpoints
 */
export function createAiRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: Math.floor(config.rateLimit.maxRequests / 2),
    standardHeaders: true,
    legacyHeaders: false,
    store: buildStore(),
    message: createErrorResponse(
      'AI request limit reached. Please wait before sending more messages.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    ),
    keyGenerator: extractClientKey,
  });
}
