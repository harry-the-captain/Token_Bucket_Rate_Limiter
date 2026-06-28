// index.js
const express = require("express");
const rateLimitMiddleware = require("./src/middleware");
const rateLimiter = require("./src/RateLimiter");
const config = require("./config");

const app = express();
app.use(express.json()); // Parse JSON request bodies

// ─── Apply Rate Limiting to ALL routes ───────────────────────────────────────
app.use(rateLimitMiddleware);

// ─── Routes ──────────────────────────────────────────────────────────────────

// Home route — just to test the server is running
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Token Bucket Rate Limiter API!",
    endpoints: {
      "GET /api/data": "A sample protected endpoint",
      "GET /api/status": "Check your current rate limit status",
      "GET /health": "Server health check (not rate limited)",
    },
  });
});

// A sample API endpoint — protected by the rate limiter
app.get("/api/data", (req, res) => {
  res.json({
    success: true,
    message: "Here is your data!",
    data: { value: Math.random() * 100 },
    timestamp: new Date().toISOString(),
  });
});

// Check your current token bucket status
app.get("/api/status", (req, res) => {
  const clientKey = req.ip;
  // Peek at status without consuming a token
  const { status } = rateLimiter.check(clientKey, 0); // 0 tokens = just check
  res.json({
    success: true,
    clientIp: clientKey,
    rateLimit: status,
  });
});

// Health check — NOT rate limited (we remove it from middleware scope by ordering)
// Note: Because we applied middleware globally above, let's use a workaround:
// We'll manually skip rate limiting for /health in the middleware (see upgrade below)
app.get("/health", (req, res) => {
  res.json({ success: true, status: "Server is running!" });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`
  ✅ Token Bucket Rate Limiter running!
  📡 Server: http://localhost:${config.PORT}
  🪣 Bucket capacity: ${config.BUCKET_CAPACITY} tokens
  ♻️  Refill rate: ${config.REFILL_RATE} tokens/second
  `);
});