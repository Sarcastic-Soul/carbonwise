import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

let RedisClient = null;
try {
  const { Redis } = await import('@upstash/redis');
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    RedisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    logger.info('Upstash Redis cache initialized.');
  } else {
    logger.info('Upstash Redis credentials not found, falling back to LRU Memory Cache.');
  }
} catch (e) {
  logger.warn('Upstash Redis module not installed, falling back to LRU Memory Cache.');
}

/**
 * Scalable Cache Service implementing Redis for distributed caching
 * with a fallback to in-memory LRU caching.
 */
class CacheService {
  constructor(maxSize = config.cache.maxSize, ttl = config.cache.ttl) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.stats = { hits: 0, misses: 0 };
    this.redis = RedisClient;
  }

  generateKey(input) {
    if (typeof input !== 'string') return '';
    return input.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  async get(key) {
    const normalizedKey = this.generateKey(key);
    
    if (this.redis) {
      try {
        const value = await this.redis.get(normalizedKey);
        if (value) {
          this.stats.hits++;
          logger.debug('Redis cache hit', { key: normalizedKey });
          return value;
        } else {
          this.stats.misses++;
          return null;
        }
      } catch (error) {
        logger.error('Redis get error', { error: error.message });
      }
    }

    // Fallback to Memory
    const entry = this.store.get(normalizedKey);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.store.delete(normalizedKey);
      this.stats.misses++;
      logger.debug('Memory cache entry expired', { key: normalizedKey });
      return null;
    }

    this.store.delete(normalizedKey);
    this.store.set(normalizedKey, entry);
    this.stats.hits++;
    logger.debug('Memory cache hit', { key: normalizedKey });
    return entry.value;
  }

  async set(key, value) {
    const normalizedKey = this.generateKey(key);

    if (this.redis) {
      try {
        await this.redis.set(normalizedKey, value, { ex: Math.floor(this.ttl / 1000) });
        logger.debug('Redis cache set', { key: normalizedKey });
        return;
      } catch (error) {
        logger.error('Redis set error', { error: error.message });
      }
    }

    // Fallback to Memory
    if (this.store.size >= this.maxSize && !this.store.has(normalizedKey)) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
      logger.debug('Memory cache eviction (LRU)', { evictedKey: oldestKey });
    }

    this.store.set(normalizedKey, {
      value,
      timestamp: Date.now(),
    });
    logger.debug('Memory cache set', { key: normalizedKey, storeSize: this.store.size });
  }

  async clear() {
    if (this.redis) {
      try {
        await this.redis.flushdb();
      } catch (e) {
        logger.error('Redis flush error', { error: e.message });
      }
    }
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.info('Cache cleared');
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';

    return {
      type: this.redis ? 'redis' : 'memory',
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
    };
  }
}

export const cacheService = new CacheService();
