// src/TokenBucket.js

class TokenBucket {
  /**
   * @param {number} capacity  - Max tokens the bucket can hold
   * @param {number} refillRate - Tokens added per second
   */
  constructor(capacity, refillRate) {
    this.capacity = capacity;       // Max size of the bucket
    this.refillRate = refillRate;   // Tokens per second
    this.tokens = capacity;         // Start full
    this.lastRefillTime = Date.now(); // Track last refill timestamp
  }

  /**
   * Refill tokens based on how much time has passed since last refill.
   * This is called BEFORE every request check.
   */
  refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000; // Convert ms to seconds

    // Calculate how many tokens to add
    const tokensToAdd = elapsedSeconds * this.refillRate;

    // Add tokens but don't exceed capacity
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);

    // Update the last refill time to now
    this.lastRefillTime = now;
  }

  /**
   * Try to consume a token.
   * Returns true if allowed, false if rate limited.
   * @param {number} tokensRequested - Usually 1 per request
   */
  consume(tokensRequested = 1) {
    // First, add any tokens that have accumulated since last check
    this.refill();

    if (this.tokens >= tokensRequested) {
      // We have enough tokens — allow the request
      this.tokens -= tokensRequested;
      return true;
    }

    // Not enough tokens — reject the request
    return false;
  }

  /**
   * Get current status of the bucket (for debugging/response headers)
   */
  getStatus() {
    return {
      tokens: Math.floor(this.tokens),
      capacity: this.capacity,
      refillRate: this.refillRate,
    };
  }
}

module.exports = TokenBucket;