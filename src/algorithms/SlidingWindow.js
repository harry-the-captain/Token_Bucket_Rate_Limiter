// src/algorithms/SlidingWindow.js

/**
 * Sliding Window Rate Limiter
 *
 * Instead of tokens, it tracks timestamps of past requests.
 * A request is allowed only if fewer than maxRequests occurred
 * within the last `windowMs` milliseconds.
 *
 * More accurate than token bucket — no burst at window boundaries.
 */
class SlidingWindow {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;       // e.g. 60000 = 1 minute
    this.maxRequests = maxRequests; // e.g. 100 requests per window
    this.requestTimestamps = [];    // array of timestamps
  }

  // Remove timestamps that are outside the current window
  _cleanup(now) {
    const windowStart = now - this.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > windowStart
    );
  }

  consume() {
    const now = Date.now();
    this._cleanup(now);

    if (this.requestTimestamps.length < this.maxRequests) {
      this.requestTimestamps.push(now);
      return {
        allowed: true,
        remaining: this.maxRequests - this.requestTimestamps.length,
      };
    }

    // Calculate when the oldest request expires and we can retry
    const oldestRequest = this.requestTimestamps[0];
    const retryAfterMs = oldestRequest + this.windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  getStatus() {
    const now = Date.now();
    this._cleanup(now);
    return {
      algorithm: "sliding-window",
      requestsInWindow: this.requestTimestamps.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      remaining: Math.max(0, this.maxRequests - this.requestTimestamps.length),
    };
  }
}

module.exports = SlidingWindow;