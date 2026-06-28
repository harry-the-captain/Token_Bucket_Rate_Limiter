// src/middleware.js
const rateLimiter = require("./RateLimiter");

/**
 * Express middleware that rate limits requests by IP address.
 *
 * Usage: app.use(rateLimitMiddleware)
 */
function rateLimitMiddleware(req, res, next) {
  // Use the client's IP as their unique identifier
  // req.ip gives the IP address in Express
  const clientKey = req.ip;

  const { allowed, status } = rateLimiter.check(clientKey);

  // Always send back helpful headers so clients know their limit status
  res.setHeader("X-RateLimit-Limit", status.capacity);
  res.setHeader("X-RateLimit-Remaining", status.tokens);
  res.setHeader("X-RateLimit-RefillRate", `${status.refillRate} tokens/sec`);

  if (!allowed) {
    // 429 = "Too Many Requests" — the standard HTTP code for rate limiting
    return res.status(429).json({
      success: false,
      error: "Too Many Requests",
      message: "You have exceeded the rate limit. Please wait and try again.",
      retryAfter: `${Math.ceil(1 / status.refillRate)} seconds`,
    });
  }

  // Request is allowed — pass control to the next handler
  next();
}

module.exports = rateLimitMiddleware;