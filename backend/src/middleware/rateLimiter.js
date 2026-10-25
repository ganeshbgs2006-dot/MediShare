/**
 * MediShare In-Memory Sliding Window Rate Limiter
 * Provides IP-based rate limiting for authentication, sensitive APIs, and reporting.
 * Automatically purges stale IP windows to keep memory footprint bounded.
 */

class RateLimiter {
  constructor({ windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests, please try again later.' }) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.hits = new Map();

    // Clean up expired buckets every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (now > record.resetTime) {
        this.hits.delete(key);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // In automated testing environments, allow requests without throttling
      if (process.env.NODE_ENV === 'test') {
        return next();
      }

      const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const now = Date.now();

      let record = this.hits.get(ip);
      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs
        };
        this.hits.set(ip, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('RateLimit-Limit', this.maxRequests);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);

      if (record.count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          error: this.message,
          retryAfterSeconds: resetSeconds
        });
      }

      next();
    };
  }
}

// 1. Strict rate limiter for authentication routes (login / register)
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30,
  message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'
}).middleware();

// 2. Standard API rate limiter
export const standardRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 500,
  message: 'Rate limit exceeded. Please slow down your requests.'
}).middleware();

// 3. Export rate limiter for CSV generation
export const exportRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Report export limit exceeded. Please try again shortly.'
}).middleware();

export default {
  authRateLimiter,
  standardRateLimiter,
  exportRateLimiter
};
