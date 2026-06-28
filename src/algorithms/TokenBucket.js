// src/algorithms/TokenBucket.js
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate;   // tokens per second
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  consume(tokensRequested = 1) {
    this.refill();
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return { allowed: true, remaining: Math.floor(this.tokens) };
    }
    // Calculate how long until enough tokens are available
    const waitSeconds = (tokensRequested - this.tokens) / this.refillRate;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.ceil(waitSeconds * 1000),
    };
  }

  getStatus() {
    this.refill(); // ensure tokens are up to date before reporting
    return {
      algorithm: "token-bucket",
      tokens: Math.floor(this.tokens),
      capacity: this.capacity,
      refillRate: this.refillRate,
    };
  }
}

module.exports = TokenBucket;