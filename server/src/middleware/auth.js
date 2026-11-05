
import { supabaseAnon } from '../config/supabase.js';

import { sessionService } from '../services/sessionService.js';

import { ApiError } from '../utils/ApiError.js';

import { asyncHandler } from './error.js';

import { logger } from '../utils/logger.js';

import {
  verifyJwtLocally,
  isJwtVerifyConfigured,
} from '../utils/jwtVerify.js';

// --------------------------------------------------
// Authentication cache
// --------------------------------------------------

const userCache = new Map();

const CACHE_TTL_MS = 60_000;
const CACHE_LIMIT = 5000;

// --------------------------------------------------
// Cleanup expired cache entries
// --------------------------------------------------

setInterval(() => {
  const now = Date.now();

  for (const [token, entry] of userCache.entries()) {
    if (entry.expiresAt <= now) {
      userCache.delete(token);
    }
  }
}, 5 * 60_000).unref();

// --------------------------------------------------
// Network verification
// --------------------------------------------------

async function verifyTokenWithSupabase(token) {
  const cached = userCache.get(token);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  try {
    const { data, error } = await supabaseAnon.auth.getUser(token);

    if (error || !data?.user) {
      if (error) {
        logger.warn('Supabase Auth verification failed.', {
          message: error.message,
        });
      }

      userCache.delete(token);
      return null;
    }

    const user = data.user;

    userCache.set(token, {
      user,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    if (userCache.size > CACHE_LIMIT) {
      const firstKey = userCache.keys().next().value;
      userCache.delete(firstKey);
    }

    return user;

  } catch (error) {
    logger.error('Supabase Auth network verification error.', {
      message: error.message,
      cause: error?.cause?.code || 'unknown',
    });

    return null;
  }
}

// --------------------------------------------------
// Main token verification
// --------------------------------------------------

async function verifyToken(token) {
  // Fast path: local JWT verification.
  if (isJwtVerifyConfigured()) {
    const localUser = await verifyJwtLocally(token);

    if (localUser) {
      return localUser;
    }
  }

  // Fallback: Supabase Auth network verification.
  return verifyTokenWithSupabase(token);
}

// --------------------------------------------------
// Application session verification
// --------------------------------------------------

async function attachApplicationSession(req, user) {
  req.user = user;

  try {
    const session =
      await sessionService.ensureActiveSessionForUser(user.id);

    req.session = session;

  } catch (error) {
    logger.warn('Application session check failed.', {
      userId: user.id,
      message: error.message,
    });

    req.session = null;
  }
}

// --------------------------------------------------
// Required authentication
// --------------------------------------------------

export const requireAuth = asyncHandler(
  async (req, _res, next) => {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing access token');
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw ApiError.unauthorized('Missing access token');
    }

    const user = await verifyToken(token);

    if (!user) {
      throw ApiError.unauthorized(
        'Invalid or expired access token'
      );
    }

    req.accessToken = token;

    await attachApplicationSession(req, user);

    next();
  }
);

// --------------------------------------------------
// Optional authentication
// --------------------------------------------------

export const optionalAuth = asyncHandler(
  async (req, _res, next) => {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return next();
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return next();
    }

    const user = await verifyToken(token);

    if (user) {
      req.accessToken = token;

      await attachApplicationSession(req, user);
    }

    next();
  }
);
