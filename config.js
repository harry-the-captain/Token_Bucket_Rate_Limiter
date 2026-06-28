// config.js
module.exports = {
  PORT: process.env.PORT || 3000,

  // Rate limit tiers — different limits for different users
  TIERS: {
    free: {
      capacity: 10,       // max 10 tokens (burst limit)
      refillRate: 2,      // 2 tokens/second
      algorithm: "token-bucket",
    },
    premium: {
      capacity: 50,
      refillRate: 10,
      algorithm: "token-bucket",
    },
    admin: {
      capacity: 1000,
      refillRate: 100,
      algorithm: "sliding-window",  // admins get precise tracking
      windowMs: 60000,              // 1 minute window
      maxRequests: 1000,
    },
  },

  // Default tier for unauthenticated users
  DEFAULT_TIER: "free",

  // Store type: "memory" (dev) or "redis" (prod)
  STORE_TYPE: process.env.STORE_TYPE || "memory",

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
};