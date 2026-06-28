// src/RateLimiter.js
const config = require("../config");
const logger = require("./logger");

// Pick store based on config
const store =
  config.STORE_TYPE === "redis"
    ? require("./store/RedisStore")
    : require("./store/MemoryStore");

class RateLimiter {
  /**
   * Determine which tier a request belongs to.
   * In a real app, you'd decode a JWT or check an API key here.
   * For now we use a simple header-based approach for demonstration.
   */
  getTier(req) {
    const role = req.headers["x-user-role"] || config.DEFAULT_TIER;
    return config.TIERS[role] ? role : config.DEFAULT_TIER;
  }

  async check(req) {
    const clientKey = req.ip;
    const tierName = this.getTier(req);
    const tierConfig = config.TIERS[tierName];

    let result;

    if (config.STORE_TYPE === "redis") {
      // Redis store handles consume directly
      result = await store.consume(clientKey, tierConfig, tierName);
    } else {
      // Memory store returns the bucket; we call consume on it
      const bucket = store.getBucket(clientKey, tierConfig, tierName);
      result = bucket.consume();
    }

    logger.info("Rate limit check", {
      ip: clientKey,
      tier: tierName,
      allowed: result.allowed,
      remaining: result.remaining,
    });

    return { ...result, tier: tierName, tierConfig };
  }

  getStoreStats() {
    if (typeof store.getStats === "function") {
      return store.getStats();
    }
    return {};
  }
}

module.exports = new RateLimiter();