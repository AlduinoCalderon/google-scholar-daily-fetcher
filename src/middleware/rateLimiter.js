const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Configuration
 * Limits each IP to 100 requests per 15 minutes
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,// Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    status: 429
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiter for API-intensive endpoints
 * Limits to 20 requests per 15 minutes
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many API requests, please try again later.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  limiter,
  strictLimiter
};
