# ⚡ CarbonWise Performance Optimization & Resource Efficiency

This document details the performance engineering, caching architectures, and server optimization strategies applied to the **CarbonWise** platform.

---

## 1. Caching Mechanics: LRU with Time-To-Live (TTL)

To optimize Gemini API usage (a slow, resource-heavy API) and lower server response latency, we implemented a custom in-memory Least Recently Used (LRU) cache service (`CacheService`).

### The Design
* **Fixed Size Boundary**: The cache size is restricted to a maximum of 100 items to prevent memory consumption issues or memory leaks on long-running nodes.
* **LRU Eviction Policy**: When the cache limit is reached, the entry accessed least recently is automatically evicted.
* **TTL Expiration**: Cache items are given an expiration timestamp (default: 30 minutes). During retrievals, if `Date.now() > item.expiresAt`, the item is purged, returning `null`.
* **Key Normalization**: Prompt strings are trimmed and normalized to lowercase to prevent identical queries with different spacing or cases from causing cache misses.

```javascript
// server/services/cache.service.js
class CacheService {
  constructor(maxSize = 100, defaultTtl = 1800000) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.ttl = defaultTtl;
    // Statistics for observability
    this.hits = 0;
    this.misses = 0;
  }
  
  get(key) {
    const normalizedKey = this.generateKey(key);
    if (!this.store.has(normalizedKey)) {
      this.misses++;
      return null;
    }
    
    const entry = this.store.get(normalizedKey);
    // Expiration check
    if (Date.now() > entry.expiresAt) {
      this.store.delete(normalizedKey);
      this.misses++;
      return null;
    }
    
    // Refresh item position in Map to mark it as recently used
    this.store.delete(normalizedKey);
    this.store.set(normalizedKey, entry);
    this.hits++;
    return entry.value;
  }
}
```

---

## 2. Server Response & Transfer Optimization

* **Gzip Payload Compression**: We use `compression()` middleware to compress static files (HTML, CSS, JS) and JSON API payloads dynamically. This decreases overall bandwidth usage by **60-70%** and reduces the Time-To-First-Byte (TTFB) metric.
* **Static File Caching**: The static file server is configured to deliver assets with optimized cache headers:
  ```javascript
  app.use(express.static(join(__dirname, '..', 'public'), {
    maxAge: config.isProduction ? '1d' : 0, // 24-hour browser caching in production
    etag: true, // Entity tag checking enabled
  }));
  ```
  This reduces unnecessary file transfer operations for returning users.

---

## 3. Deployment Efficiency (Docker & Cloud Run)

* **Multi-Stage Builds**: The `Dockerfile` separates building and runtime stages. The build stage installs all development dependencies (such as test runners), while the final runtime stage only copies production code and installs dependencies matching the production flag, keeping the final container image under **150MB**.
* **Zero-Waste Container Scale-to-Zero**: The Cloud Run instance is configured with `--min-instances 0` and `--max-instances 3` with resource allocations of `1 CPU` and `512MB RAM`, ensuring zero hosting cost when the platform is not actively receiving requests.
