import { doubleCsrf } from 'csrf-csrf';
import { config } from '../config/environment.js';

const {
  doubleCsrfProtection, // This is the default CSRF protection middleware
  generateCsrfToken: generateToken, // Rename to generateToken for export compatibility
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'a-super-secret-key-for-csrf',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: config.isProduction,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getSessionIdentifier: (req) => {
    const sessionId = req.headers['x-session-id'];
    return (Array.isArray(sessionId) ? sessionId[0] : sessionId) || 'anonymous';
  },
  getCsrfTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'] || req.body['csrf-token'];
  },
});

export { doubleCsrfProtection as csrfProtection, generateToken };

