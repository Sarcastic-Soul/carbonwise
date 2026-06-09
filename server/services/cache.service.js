import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

/**
 * In-memory LRU (Least Recently Used) cache implementation.
 * Reduces redundant Gemini API calls for similar queries, improving
 * response times and reducing API costs.
 *
 * @class CacheService
 */
class CacheService {
  /**
   * Creates a new CacheService instance.
   * @param {number} [maxSize] - Maximum number of entries to store
   * @param {number} [ttl] - Time-to-live for entries in milliseconds
   */
  constructor(maxSize = config.cache.maxSize, ttl = config.cache.ttl) {
    /** @type {Map<string, {value: *, timestamp: number}>} */
    this.store = new Map();

    /** @type {number} */
    this.maxSize = maxSize;

    /** @type {number} */
    this.ttl = ttl;

    /** @type {{hits: number, misses: number}} */
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Generates a normalized cache key from a string input.
   * Normalizes the input by lowercasing and removing extra whitespace.
   * @param {string} input - The raw input to use as a key
   * @returns {string} Normalized cache key
   */
  generateKey(input) {
    if (typeof input !== 'string') {
      return '';
    }
    return input.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Retrieves a value from the cache.
   * Returns null if the key doesn't exist or has expired.
   * Expired entries are automatically evicted.
   * @param {string} key - The cache key to look up
   * @returns {*|null} The cached value, or null if not found/expired
   */
  get(key) {
    const normalizedKey = this.generateKey(key);
    const entry = this.store.get(normalizedKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.store.delete(normalizedKey);
      this.stats.misses++;
      logger.debug('Cache entry expired', { key: normalizedKey });
      return null;
    }

    // Move to end (most recently used) for LRU behavior
    this.store.delete(normalizedKey);
    this.store.set(normalizedKey, entry);

    this.stats.hits++;
    logger.debug('Cache hit', { key: normalizedKey });
    return entry.value;
  }

  /**
   * Stores a value in the cache.
   * If the cache is full, evicts the least recently used entry.
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   */
  set(key, value) {
    const normalizedKey = this.generateKey(key);

    // Evict LRU entry if at capacity
    if (this.store.size >= this.maxSize && !this.store.has(normalizedKey)) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
      logger.debug('Cache eviction (LRU)', { evictedKey: oldestKey });
    }

    this.store.set(normalizedKey, {
      value,
      timestamp: Date.now(),
    });

    logger.debug('Cache set', { key: normalizedKey, storeSize: this.store.size });
  }

  /**
   * Clears all entries from the cache and resets statistics.
   */
  clear() {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.info('Cache cleared');
  }

  /**
   * Returns current cache statistics.
   * @returns {{size: number, maxSize: number, hits: number, misses: number, hitRate: string}}
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';

    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
    };
  }
}

/** @type {CacheService} Singleton cache instance */
export const cacheService = new CacheService();
