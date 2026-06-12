/**
 * Integration tests for calculator routes.
 */

import supertest from 'supertest';

process.env.GEMINI_API_KEY = 'test-key';
process.env.NODE_ENV = 'test';

const { createApp } = await import('../../server/index.js');
const app = createApp();
const request = supertest(app);

describe('Calculator Routes', () => {
  describe('POST /api/calculator', () => {
    it('should calculate footprint with transport data', async () => {
      const res = await request.post('/api/calculator').send({
        transport: { type: 'car_gasoline', distance: 30, frequency: 'daily' },
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalKg).toBeGreaterThan(0);
      expect(res.body.data.breakdown.transport).not.toBeNull();
    });

    it('should calculate footprint with all categories', async () => {
      const res = await request.post('/api/calculator').send({
        transport: { type: 'bus', distance: 15, frequency: 'daily' },
        energy: { type: 'electricity', amount: 300 },
        diet: 'vegetarian',
        shopping: { type: 'clothing', quantity: 2 },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.breakdown.transport).not.toBeNull();
      expect(res.body.data.breakdown.energy).not.toBeNull();
      expect(res.body.data.breakdown.diet).not.toBeNull();
      expect(res.body.data.breakdown.shopping).not.toBeNull();
    });

    it('should handle empty body gracefully', async () => {
      const res = await request.post('/api/calculator').send({});
      expect(res.status).toBe(200);
      expect(res.body.data.totalKg).toBe(0);
    });

    it('should reject invalid distance', async () => {
      const res = await request.post('/api/calculator').send({
        transport: { type: 'car_gasoline', distance: -100, frequency: 'daily' },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/calculator/factors', () => {
    it('should return all emission factors', async () => {
      const res = await request.get('/api/calculator/factors');
      expect(res.status).toBe(200);
      expect(res.body.data.transport).toBeInstanceOf(Array);
      expect(res.body.data.energy).toBeInstanceOf(Array);
      expect(res.body.data.diet).toBeInstanceOf(Array);
      expect(res.body.data.shopping).toBeInstanceOf(Array);
    });
  });
});
