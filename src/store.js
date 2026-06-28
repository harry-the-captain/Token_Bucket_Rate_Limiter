// src/store.js
const TokenBucket = require("./TokenBucket");
const config = require("../config");

/**
 * In-memory store: maps a key (IP or user ID) to their TokenBucket.
 * In production, you'd use Redis instead of a plain JS Map.
 */
class BucketStore {
  constructor() {
    this.buckets = new Map(); // { "192.168.1.1" => TokenBucket }
  }

  /**
   * Get the bucket for a given key.
   * If it doesn't exist yet, create a new one.
   * @param {string} key - Usually the IP address or user ID
   */
  getBucket(key) {
    if (!this.buckets.has(key)) {
      // New user/IP — create a fresh bucket for them
      this.buckets.set(
        key,
        new TokenBucket(config.BUCKET_CAPACITY, config.REFILL_RATE)
      );
    }
    return this.buckets.get(key);
  }

  /**
   * Remove a bucket (useful for cleanup)
   */
  deleteBucket(key) {
    this.buckets.delete(key);
  }

  /**
   * Get number of tracked clients
   */
  size() {
    return this.buckets.size;
  }
}

// Export a single shared instance (singleton pattern)
module.exports = new BucketStore();