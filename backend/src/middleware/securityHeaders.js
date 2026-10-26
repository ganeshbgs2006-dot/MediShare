import { env } from '../config/env.js';

/**
 * Standard Security Headers Middleware for MediShare API
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by restricting framing
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Enable browser cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security for production HTTPS
  if (!env.isDev) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove express signature
  res.removeHeader('X-Powered-By');

  next();
}

export default securityHeaders;

