// src/store/MemoryStore.js
const TokenBucket = require("../algorithms/TokenBucket");
const SlidingWindow = require("../algorithms/SlidingWindow");

class MemoryStore {
  constructor() {
    this.buckets = new Map();

    // Auto-cleanup stale entries every 5 minutes to prevent memory leaks
    setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  _makeKey(clientKey, tier) {
    return `${tier}:${clientKey}`;
  }

  getBucket(clientKey, tierConfig, tierName) {
    const key = this._makeKey(clientKey, tierName);

    if (!this.buckets.has(key)) {
      let bucket;
      if (tierConfig.algorithm === "sliding-window") {
        bucket = new SlidingWindow(tierConfig.windowMs, tierConfig.maxRequests);
      } else {
        bucket = new TokenBucket(tierConfig.capacity, tierConfig.refillRate);
      }
      this.buckets.set(key, { bucket, lastAccessed: Date.now() });
    }

    const entry = this.buckets.get(key);
    entry.lastAccessed = Date.now();
    return entry.bucket;
  }

  // Remove entries not accessed in the last 10 minutes
  _cleanup() {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [key, entry] of this.buckets) {
      if (entry.lastAccessed < cutoff) {
        this.buckets.delete(key);
      }
    }
  }

  getStats() {
    return {
      totalClients: this.buckets.size,
      storeType: "memory",
    };
  }
}

module.exports = new MemoryStore();