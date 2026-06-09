/**
 * Integration tests for security middleware.
 * Verifies that all security headers and protections are active.
 */

import { jest } from '@jest/globals';
import supertest from 'supertest';

process.env.GEMINI_API_KEY = 'test-key';
process.env.NODE_ENV = 'test';

const { createApp } = await import('../../server/index.js');
const app = createApp();
const request = supertest(app);

describe('Security', () => {
  describe('HTTP Security Headers', () => {
    it('should set X-Content-Type-Options header', async () => {
      const res = await request.get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options or CSP frame-ancestors', async () => {
      const res = await request.get('/api/health');
      const hasFrameProtection =
        res.headers['x-frame-options'] ||
        (res.headers['content-security-policy'] &&
          res.headers['content-security-policy'].includes('frame'));
      expect(hasFrameProtection).toBeTruthy();
    });

    it('should set Content-Security-Policy header', async () => {
      const res = await request.get('/api/health');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toContain("default-src");
    });

    it('should set Strict-Transport-Security header', async () => {
      const res = await request.get('/api/health');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });

    it('should set Referrer-Policy header', async () => {
      const res = await request.get('/api/health');
      expect(res.headers['referrer-policy']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject chat messages exceeding max length', async () => {
      const longMessage = 'a'.repeat(2500);
      const res = await request.post('/api/chat').send({ message: longMessage });
      expect(res.status).toBe(400);
    });

    it('should reject empty chat messages', async () => {
      const res = await request.post('/api/chat').send({ message: '' });
      expect(res.status).toBe(400);
    });

    it('should reject missing chat message field', async () => {
      const res = await request.post('/api/chat').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('API Error Handling', () => {
    it('should return 404 for unknown API routes', async () => {
      const res = await request.get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return JSON for 404 errors', async () => {
      const res = await request.get('/api/unknown');
      expect(res.headers['content-type']).toContain('json');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request.get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
