// tests/rateLimiter.test.js
const TokenBucket = require("../src/TokenBucket");

describe("TokenBucket", () => {
  test("should start full", () => {
    const bucket = new TokenBucket(10, 2);
    expect(bucket.tokens).toBe(10);
  });

  test("should allow requests when tokens are available", () => {
    const bucket = new TokenBucket(10, 2);
    expect(bucket.consume(1)).toBe(true);
    expect(bucket.tokens).toBeCloseTo(9, 0);
  });

  test("should reject requests when bucket is empty", () => {
    const bucket = new TokenBucket(3, 1);
    bucket.consume(1);
    bucket.consume(1);
    bucket.consume(1);
    // Bucket is now empty
    expect(bucket.consume(1)).toBe(false);
  });

  test("should not exceed capacity when refilling", () => {
    const bucket = new TokenBucket(5, 10);
    bucket.tokens = 5; // Already full
    bucket.refill();
    expect(bucket.tokens).toBeLessThanOrEqual(5);
  });

  test("getStatus returns correct info", () => {
    const bucket = new TokenBucket(10, 2);
    const status = bucket.getStatus();
    expect(status.capacity).toBe(10);
    expect(status.refillRate).toBe(2);
  });
});