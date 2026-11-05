
import {
  jwtVerify,
  decodeProtectedHeader,
  createRemoteJWKSet,
} from 'jose';

import { createSecretKey } from 'node:crypto';
import { logger } from './logger.js';

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');

const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

const ISSUER = supabaseUrl
  ? `${supabaseUrl}/auth/v1`
  : null;

const AUDIENCE = 'authenticated';

const HMAC_ALGORITHMS = ['HS256', 'HS384', 'HS512'];
const ASYMMETRIC_ALGORITHMS = ['ES256', 'RS256'];

let secretKey = null;
let remoteJwks = null;

const tokenCache = new Map();

const CACHE_LIMIT = 5000;

let loggedSuccess = false;
let loggedFallback = false;

// --------------------------------------------------
// Initialize legacy HMAC verification
// --------------------------------------------------

if (jwtSecret.length > 0) {
  try {
    secretKey = createSecretKey(
      Buffer.from(jwtSecret, 'utf8')
    );

    logger.info('Legacy HMAC JWT verification initialized.');
  } catch (error) {
    logger.error('JWT secret initialization failed.', {
      message: error.message,
    });
  }
}

// --------------------------------------------------
// Initialize Supabase JWKS verification
// --------------------------------------------------

if (supabaseUrl) {
  try {
    const jwksUrl = new URL(
      `${supabaseUrl}/auth/v1/.well-known/jwks.json`
    );

    remoteJwks = createRemoteJWKSet(jwksUrl);

    logger.info('Supabase remote JWKS verification initialized.');
  } catch (error) {
    logger.error('Supabase JWKS initialization failed.', {
      message: error.message,
    });
  }
} else {
  logger.warn(
    'SUPABASE_URL missing. Asymmetric local JWT verification disabled.'
  );
}

// --------------------------------------------------
// Logging helper
// --------------------------------------------------

function logFallback(message, details = {}) {
  if (loggedFallback) return;

  logger.warn(message, details);
  loggedFallback = true;
}

// --------------------------------------------------
// Cache helper
// --------------------------------------------------

function cacheUser(token, user, exp) {
  tokenCache.set(token, {
    user,
    exp,
  });

  if (tokenCache.size > CACHE_LIMIT) {
    const firstKey = tokenCache.keys().next().value;
    tokenCache.delete(firstKey);
  }
}

// --------------------------------------------------
// Main JWT verification
// --------------------------------------------------

export async function verifyJwtLocally(token) {
  if (!token) return null;

  const now = Math.floor(Date.now() / 1000);

  // Check verified token cache.
  const cached = tokenCache.get(token);

  if (cached) {
    if (cached.exp > now + 5) {
      return cached.user;
    }

    tokenCache.delete(token);
  }

  // Read JWT header.
  let header;

  try {
    header = decodeProtectedHeader(token);
  } catch (error) {
    logFallback('Invalid JWT header.', {
      message: error.message,
    });

    return null;
  }

  const algorithm = header.alg;

  let verificationKey;
  let allowedAlgorithms;

  // ------------------------------------------------
  // HS256 / HS384 / HS512
  // ------------------------------------------------

  if (HMAC_ALGORITHMS.includes(algorithm)) {
    if (!secretKey) {
      return null;
    }

    verificationKey = secretKey;
    allowedAlgorithms = HMAC_ALGORITHMS;
  }

  // ------------------------------------------------
  // ES256 / RS256 using Supabase JWKS
  // ------------------------------------------------

  else if (ASYMMETRIC_ALGORITHMS.includes(algorithm)) {
    if (!remoteJwks || !ISSUER) {
      logFallback(
        'Supabase JWKS unavailable. Using network verification.'
      );

      return null;
    }

    verificationKey = remoteJwks;
    allowedAlgorithms = ASYMMETRIC_ALGORITHMS;
  }

  // ------------------------------------------------
  // Unsupported algorithm
  // ------------------------------------------------

  else {
    logFallback(
      `Unsupported JWT algorithm: ${algorithm}.`
    );

    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      verificationKey,
      {
        algorithms: allowedAlgorithms,
        issuer: ISSUER || undefined,
        audience: AUDIENCE,
        clockTolerance: 5,
      }
    );

    // Validate essential Supabase claims.
    if (!payload.sub || typeof payload.sub !== 'string') {
      return null;
    }

    if (!payload.exp || typeof payload.exp !== 'number') {
      return null;
    }

    if (payload.exp <= now) {
      return null;
    }

    const user = {
      id: payload.sub,
      email: payload.email || '',
      app_metadata: payload.app_metadata || {},
      user_metadata: payload.user_metadata || {},
      role: payload.role || 'authenticated',
    };

    cacheUser(token, user, payload.exp);

    if (!loggedSuccess) {
      logger.info(
        `Local JWT verification successful using ${algorithm}.`
      );

      loggedSuccess = true;
    }

    return user;

  } catch (error) {
    // JWKS fetch errors, key rotation and invalid signatures
    // fall back to Supabase Auth getUser() in auth.js.

    logFallback('Local JWT verification failed.', {
      algorithm,
      code: error.code,
      message: error.message,
    });

    return null;
  }
}

// --------------------------------------------------
// Configuration status
// --------------------------------------------------

export function isJwtVerifyConfigured() {
  return Boolean(
    remoteJwks || secretKey
  );
}
