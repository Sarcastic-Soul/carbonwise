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
    logger.error('CRITICAL ALERT: Upstash Redis credentials not found. Falling back to LRU Memory Cache. This may cause inconsistent state in multi-node deployments.');
  }
} catch (e) {
  logger.error(`CRITICAL ALERT: Upstash Redis initialization failed: ${e.message}. Falling back to LRU Memory Cache.`);
}

/**
 * Scalable Cache Service implementing Redis for distributed caching
 * with a fallback to in-memory LRU caching.
 */
class CacheService {
  /**
   * @param {number} [maxSize=config.cache.maxSize] Maximum number of items for LRU fallback
   * @param {number} [ttl=config.cache.ttl] Time-to-live for cache entries in milliseconds
   */
  constructor(maxSize = config.cache.maxSize, ttl = config.cache.ttl) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.stats = { hits: 0, misses: 0 };
    this.redis = RedisClient;
  }

  /**
   * Generates a normalized cache key.
   * @param {string} input - The input string to normalize
   * @returns {string} Normalized cache key
   */
  generateKey(input) {
    if (typeof input !== 'string') {return '';}
    return input.toLowerCase().replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Retrieves an item from the cache.
   * LRU Policy: Re-inserts the item into the Map to mark it as recently used.
   * @param {string} key - The cache key to retrieve
   * @returns {Promise<any>} The cached value or null if not found/expired
   */
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

    // LRU update: remove and re-insert to put at the end of Map (most recently used)
    this.store.delete(normalizedKey);
    this.store.set(normalizedKey, entry);
    this.stats.hits++;
    logger.debug('Memory cache hit', { key: normalizedKey });
    return entry.value;
  }

  /**
   * Stores an item in the cache.
   * LRU Eviction Policy: If the store exceeds maxSize, the oldest entry (first in Map) is evicted.
   * @param {string} key - The cache key
   * @param {any} value - The value to store
   * @returns {Promise<void>}
   */
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
      // LRU eviction: the first item in Map.keys() is the oldest inserted
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

  /**
   * Clears the entire cache (both Redis and memory).
   * @returns {Promise<void>}
   */
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

  /**
   * Retrieves cache statistics.
   * @returns {{type: string, size: number, maxSize: number, hits: number, misses: number, hitRate: string}}
   */
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
