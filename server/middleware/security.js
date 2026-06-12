import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config/environment.js';

/**
 * Configures and returns Helmet middleware with strict Content Security Policy.
 * Helmet sets various HTTP headers to help protect the app from well-known
 * web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.).
 * @returns {import('express').RequestHandler} Configured Helmet middleware
 */
export function createSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

/**
 * Configures and returns CORS middleware.
 * In production, restricts origins to the deployed domain.
 * In development, allows all origins for ease of testing.
 * @returns {import('express').RequestHandler} Configured CORS middleware
 */
export function createCorsMiddleware() {
  const corsOptions = {
    origin: config.isProduction ? false : true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: config.security.corsMaxAge,
  };
  return cors(corsOptions);
}
