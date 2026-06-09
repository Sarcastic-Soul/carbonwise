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
    it('should store and retrieve values', () => {
      cacheService.set('test key', 'test value');
      expect(cacheService.get('test key')).toBe('test value');
    });

    it('should return null for non-existent keys', () => {
      expect(cacheService.get('nonexistent')).toBeNull();
    });

    it('should be case-insensitive', () => {
      cacheService.set('Hello World', 'data');
      expect(cacheService.get('hello world')).toBe('data');
      expect(cacheService.get('HELLO WORLD')).toBe('data');
    });
  });

  describe('TTL expiry', () => {
    it('should expire entries after TTL', () => {
      // Create cache with very short TTL
      const originalTtl = cacheService.ttl;
      cacheService.ttl = 1; // 1ms TTL

      cacheService.set('expire-test', 'value');

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(cacheService.get('expire-test')).toBeNull();
          cacheService.ttl = originalTtl;
          resolve();
        }, 10);
      });
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      const originalMax = cacheService.maxSize;
      cacheService.maxSize = 3;

      cacheService.set('key1', 'val1');
      cacheService.set('key2', 'val2');
      cacheService.set('key3', 'val3');
      cacheService.set('key4', 'val4'); // Should evict key1

      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key4')).toBe('val4');

      cacheService.maxSize = originalMax;
    });
  });

  describe('clear', () => {
    it('should clear all entries and reset stats', () => {
      cacheService.set('a', '1');
      cacheService.set('b', '2');
      cacheService.clear();

      expect(cacheService.get('a')).toBeNull();
      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should track hits and misses', () => {
      cacheService.set('hit', 'value');
      cacheService.get('hit');   // hit
      cacheService.get('miss');  // miss

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe('50.0%');
    });
  });
});
