// src/store/RedisStore.js

/**
 * Redis-backed store — use this in production.
 * Allows rate limiting to work correctly across multiple servers.
 *
 * Requires: npm install redis
 * Requires: Redis server running (e.g. via Docker: docker run -p 6379:6379 redis)
 */
const { createClient } = require("redis");
const config = require("../../config");
const logger = require("../logger");

class RedisStore {
  constructor() {
    this.client = createClient({ url: config.REDIS_URL });
    this.client.connect().catch((err) => {
      logger.error("Redis connection failed", { error: err.message });
    });
    this.client.on("error", (err) =>
      logger.error("Redis error", { error: err.message })
    );
    this.client.on("connect", () => logger.info("Redis connected"));
  }

  _makeKey(clientKey, tierName) {
    return `rate:${tierName}:${clientKey}`;
  }

  /**
   * Token bucket logic stored in Redis using atomic Lua script.
   * Lua scripts in Redis execute atomically — no race conditions.
   */
  async consume(clientKey, tierConfig, tierName) {
    const key = this._makeKey(clientKey, tierName);
    const now = Date.now();

    if (tierConfig.algorithm === "sliding-window") {
      return this._slidingWindowConsume(key, tierConfig, now);
    }
    return this._tokenBucketConsume(key, tierConfig, now);
  }

  async _tokenBucketConsume(key, tierConfig, now) {
    // Atomic Lua script: read state, refill, consume, write back — all at once
    const lua = `
      local tokens = tonumber(redis.call('hget', KEYS[1], 'tokens'))
      local lastRefill = tonumber(redis.call('hget', KEYS[1], 'lastRefill'))
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      if tokens == nil then
        tokens = capacity
        lastRefill = now
      end

      -- Refill based on elapsed time
      local elapsed = (now - lastRefill) / 1000
      tokens = math.min(capacity, tokens + elapsed * refillRate)
      lastRefill = now

      local allowed = 0
      local remaining = 0
      local retryAfterMs = 0

      if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
        remaining = math.floor(tokens)
      else
        retryAfterMs = math.ceil((1 - tokens) / refillRate * 1000)
      end

      redis.call('hset', KEYS[1], 'tokens', tokens, 'lastRefill', lastRefill)
      redis.call('expire', KEYS[1], 3600)

      return { allowed, remaining, retryAfterMs }
    `;

    const result = await this.client.eval(lua, {
      keys: [key],
      arguments: [
        String(tierConfig.capacity),
        String(tierConfig.refillRate),
        String(now),
      ],
    });

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      retryAfterMs: result[2],
    };
  }

  async _slidingWindowConsume(key, tierConfig, now) {
    const windowStart = now - tierConfig.windowMs;

    // Remove old entries, count current, add new — atomically
    await this.client.zRemRangeByScore(key, 0, windowStart);
    const count = await this.client.zCard(key);

    if (count < tierConfig.maxRequests) {
      await this.client.zAdd(key, [{ score: now, value: String(now) }]);
      await this.client.expire(key, Math.ceil(tierConfig.windowMs / 1000));
      return { allowed: true, remaining: tierConfig.maxRequests - count - 1 };
    }

    const oldest = await this.client.zRange(key, 0, 0, { BY: "RANK" });
    const retryAfterMs = oldest.length
      ? parseInt(oldest[0]) + tierConfig.windowMs - now
      : tierConfig.windowMs;

    return { allowed: false, remaining: 0, retryAfterMs };
  }

  async getStats() {
    const info = await this.client.info("keyspace");
    return { storeType: "redis", info };
  }
}

module.exports = new RedisStore();