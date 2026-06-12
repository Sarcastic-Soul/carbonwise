/**
 * Unit tests for CacheService.
 * Tests LRU caching, TTL expiry, key normalization, and eviction.
 */

import { jest } from '@jest/globals';

// We need to import the class fresh, so import the module
let cacheModule;
let cacheService;

beforeEach(async () => {
  cacheModule = await import('../../server/services/cache.service.js');
  cacheService = cacheModule.cacheService;
  cacheService.clear();
});

describe('CacheService', () => {
  describe('generateKey', () => {
    it('should normalize keys to lowercase with single spaces', () => {
      expect(cacheService.generateKey('  Hello   World  ')).toBe('hello world');
    });

    it('should return empty string for non-string input', () => {
      expect(cacheService.generateKey(123)).toBe('');
      expect(cacheService.generateKey(null)).toBe('');
    });
  });

  describe('get/set', () => {
    it('should store and retrieve values', async () => {
      await cacheService.set('key', 'value');
      expect(await cacheService.get('key')).toBe('value');
    });

    it('should return null for non-existent keys', async () => {
      expect(await cacheService.get('missing')).toBeNull();
    });

    it('should be case-insensitive', async () => {
      await cacheService.set('TEST KEY', 'value');
      expect(await cacheService.get('test key')).toBe('value');
    });
  });

  describe('TTL expiry', () => {
    it('should expire entries after TTL', async () => {
      const originalTtl = cacheService.ttl;
      cacheService.ttl = 1; // 1ms TTL

      await cacheService.set('expire-test', 'value');
      
      // We don't even need jest timers for this if we just wait a real ms or two, 
      // but since it's an async test, let's just wait a tiny bit to be safe.
      await new Promise(r => setTimeout(r, 10));

      expect(await cacheService.get('expire-test')).toBeNull();
      
      cacheService.ttl = originalTtl;
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', async () => {
      const originalMax = cacheService.maxSize;
      cacheService.maxSize = 3;

      await cacheService.set('key1', 'val1');
      await cacheService.set('key2', 'val2');
      await cacheService.set('key3', 'val3');
      await cacheService.set('key4', 'val4'); // Should evict key1

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key4')).toBe('val4');
      
      cacheService.maxSize = originalMax;
    });
  });

  describe('clear', () => {
    it('should clear all entries and reset stats', async () => {
      await cacheService.set('a', 1);
      await cacheService.set('b', 2);
      await cacheService.clear();

      expect(await cacheService.get('a')).toBeNull();
      expect(cacheService.getStats().size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should track hits and misses', async () => {
      await cacheService.clear();
      await cacheService.set('hit', 'value');
      await cacheService.get('hit'); // hit
      await cacheService.get('miss'); // miss

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe('50.0%');
    });
  });

  describe('Redis connection failures', () => {
    it('should fallback to memory on Redis set failure', async () => {
      cacheService.redis = {
        set: jest.fn().mockRejectedValue(new Error('Redis Timeout')),
      };
      await cacheService.set('key', 'value');
      expect(await cacheService.get('key')).toBe('value');
      cacheService.redis = null;
    });

    it('should hit Redis for get and set', async () => {
      cacheService.redis = {
        set: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue('redis_value'),
      };
      await cacheService.set('key', 'redis_value');
      expect(await cacheService.get('key')).toBe('redis_value');
      cacheService.redis = null;
    });

    it('should return null when Redis reports a cache miss', async () => {
      await cacheService.set('key', 'value');
      cacheService.redis = {
        get: jest.fn().mockResolvedValue(null),
      };
      // Redis is the authoritative store when available; a Redis miss means miss
      expect(await cacheService.get('key')).toBeNull();
      cacheService.redis = null;
    });

    it('should fallback to memory on Redis get failure', async () => {
      await cacheService.set('key', 'value');
      cacheService.redis = {
        get: jest.fn().mockRejectedValue(new Error('Redis Timeout')),
      };
      expect(await cacheService.get('key')).toBe('value');
      cacheService.redis = null;
    });

    it('should handle Redis clear failure', async () => {
      cacheService.redis = {
        flushdb: jest.fn().mockRejectedValue(new Error('Redis Timeout')),
      };
      await expect(cacheService.clear()).resolves.toBeUndefined();
      cacheService.redis = null;
    });
  });
});
