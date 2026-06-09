import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { config, validateConfig } from './config/environment.js';
import { createSecurityHeaders, createCorsMiddleware } from './middleware/security.js';
import { createRateLimiter, createAiRateLimiter } from './middleware/rateLimiter.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import chatRoutes from './routes/chat.routes.js';
import calculatorRoutes from './routes/calculator.routes.js';
import tipsRoutes from './routes/tips.routes.js';

/**
 * Resolve __dirname for ES modules.
 * @type {string}
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates and configures the Express application.
 * Separated from server startup for testability with Supertest.
 * @returns {import('express').Application} Configured Express app
 */
export function createApp() {
  const app = express();

  // ──────────────────────────────────────────────
  // Global Middleware
  // ──────────────────────────────────────────────

  // Security headers (Helmet + CSP)
  app.use(createSecurityHeaders());

  // CORS configuration
  app.use(createCorsMiddleware());

  // Gzip compression for all responses
  app.use(compression());

  // Parse JSON request bodies with a size limit
  app.use(express.json({ limit: '10kb' }));

  // General rate limiter
  app.use(createRateLimiter());

  // Serve static files from /public with caching
  app.use(
    express.static(join(__dirname, '..', 'public'), {
      maxAge: config.isProduction ? '1d' : 0,
      etag: true,
    })
  );

  // ──────────────────────────────────────────────
  // API Routes
  // ──────────────────────────────────────────────

  // AI-powered routes get stricter rate limiting
  app.use('/api/chat', createAiRateLimiter(), chatRoutes);
  app.use('/api/tips', createAiRateLimiter(), tipsRoutes);

  // Calculator routes use general rate limiting
  app.use('/api/calculator', calculatorRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // ──────────────────────────────────────────────
  // Error Handling
  // ──────────────────────────────────────────────

  // Handle 404 for API routes
  app.use('/api/*', notFoundHandler);

  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (_req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });

  // Global error handler (must be last middleware)
  app.use(globalErrorHandler);

  return app;
}

/**
 * Starts the Express server.
 * Only runs when this file is executed directly (not when imported for testing).
 */
function startServer() {
  try {
    validateConfig();
  } catch (error) {
    logger.error('Configuration validation failed', { error: error.message });
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(`CarbonWise server started`, {
      port: config.port,
      environment: config.nodeEnv,
      url: `http://localhost:${config.port}`,
    });
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server only when this file is the entry point (not imported by tests)
const currentFile = fileURLToPath(import.meta.url);
const isDirectRun =
  process.argv[1] && currentFile === process.argv[1];

if (isDirectRun) {
  startServer();
}

export default createApp;
