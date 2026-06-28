// src/middleware.js
const rateLimiter = require("./RateLimiter");

// Routes that skip rate limiting entirely
const SKIP_ROUTES = ["/health", "/api/admin/stats"];

async function rateLimitMiddleware(req, res, next) {
  // Skip rate limiting for whitelisted routes
  if (SKIP_ROUTES.includes(req.path)) return next();

  try {
    const result = await rateLimiter.check(req);

    // Set standard rate limit headers
    res.setHeader("X-RateLimit-Tier", result.tier);
    res.setHeader(
      "X-RateLimit-Limit",
      result.tierConfig.capacity || result.tierConfig.maxRequests
    );
    res.setHeader("X-RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
      res.setHeader(
        "Retry-After",
        Math.ceil((result.retryAfterMs || 1000) / 1000)
      );
      return res.status(429).json({
        success: false,
        error: "Too Many Requests",
        message: `Rate limit exceeded for '${result.tier}' tier.`,
        retryAfterMs: result.retryAfterMs,
        tier: result.tier,
      });
    }

    next();
  } catch (err) {
    // If rate limiter itself fails, fail open (let request through)
    // In production you might want to fail closed instead
    console.error("Rate limiter error:", err.message);
    next();
  }
}

module.exports = rateLimitMiddleware;