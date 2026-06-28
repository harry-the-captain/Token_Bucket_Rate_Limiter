const TokenBucket = require("../src/algorithms/TokenBucket");
const SlidingWindow = require("../src/algorithms/SlidingWindow");

describe("TokenBucket", () => {
  test("starts full", () => {
    const b = new TokenBucket(10, 2);
    expect(b.tokens).toBe(10);
  });

  test("allows request and deducts token", () => {
    const b = new TokenBucket(10, 2);
    const r = b.consume();
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(9);
  });

  test("rejects when empty and returns retryAfterMs", () => {
    const b = new TokenBucket(1, 1);
    b.consume();
    const r = b.consume();
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  test("does not exceed capacity on refill", () => {
    const b = new TokenBucket(5, 100);
    b.tokens = 5;
    b.refill();
    expect(b.tokens).toBeLessThanOrEqual(5);
  });
});

describe("SlidingWindow", () => {
  test("allows requests within limit", () => {
    const sw = new SlidingWindow(60000, 5);
    for (let i = 0; i < 5; i++) {
      expect(sw.consume().allowed).toBe(true);
    }
  });

  test("rejects when limit exceeded", () => {
    const sw = new SlidingWindow(60000, 3);
    sw.consume(); sw.consume(); sw.consume();
    const r = sw.consume();
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  test("allows again after window expires", (done) => {
    const sw = new SlidingWindow(100, 1); // 100ms window
    sw.consume();
    expect(sw.consume().allowed).toBe(false);
    setTimeout(() => {
      expect(sw.consume().allowed).toBe(true);
      done();
    }, 150);
  });
});