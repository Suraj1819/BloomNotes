// server/src/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';

export const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => fail(res, { status: 429, message: 'Too many requests', code: 'RATE_LIMIT' }),
});

// Stricter limiter for auth endpoints.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => fail(res, { status: 429, message: 'Too many auth attempts', code: 'AUTH_RATE_LIMIT' }),
});
