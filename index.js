// index.js
const express = require("express");
const rateLimitMiddleware = require("./src/middleware");
const rateLimiter = require("./src/RateLimiter");
const config = require("./config");
const logger = require("./src/logger");

const app = express();
app.use(express.json());
app.use(rateLimitMiddleware);

// ── Public routes ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Token Bucket Rate Limiter API",
    tip: "Pass 'x-user-role: premium' or 'x-user-role: admin' header to test tiers",
    endpoints: {
      "GET /api/data": "Protected endpoint",
      "GET /api/status": "Your current rate limit status",
      "GET /api/admin/stats": "Live server stats (not rate limited)",
      "GET /health": "Health check",
    },
  });
});

app.get("/api/data", (req, res) => {
  res.json({
    success: true,
    data: { value: Math.random() * 100 },
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/status", async (req, res) => {
  const result = await rateLimiter.check(req);
  res.json({ success: true, rateLimit: result });
});

// ── Admin / ops routes (not rate limited) ─────────────────
app.get("/api/admin/stats", (req, res) => {
  const stats = rateLimiter.getStoreStats();
  res.json({
    success: true,
    store: stats,
    tiers: Object.keys(config.TIERS).map((name) => ({
      name,
      ...config.TIERS[name],
    })),
    uptime: process.uptime(),
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.listen(config.PORT, () => {
  logger.info(`Server started`, {
    port: config.PORT,
    store: config.STORE_TYPE,
    tiers: Object.keys(config.TIERS),
  });
});