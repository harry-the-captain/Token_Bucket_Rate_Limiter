// src/RateLimiter.js
const store = require("./store");

class RateLimiter {
  /**
   * Check if a request from `clientKey` should be allowed.
   * @param {string} clientKey - IP address or user ID
   * @param {number} tokensNeeded - Default is 1 per request
   * @returns {{ allowed: boolean, status: object }}
   */
  check(clientKey, tokensNeeded = 1) {
    const bucket = store.getBucket(clientKey);
    const allowed = bucket.consume(tokensNeeded);
    const status = bucket.getStatus();

    return { allowed, status };
  }
}

module.exports = new RateLimiter();