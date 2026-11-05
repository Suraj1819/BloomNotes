// server/src/services/sessionService.js
// ---------------------------------------------------------------------------
// Trusted, server-side application session management.
// ---------------------------------------------------------------------------
// Tracks genuine user activity separately from background requests.
// Background autosave/polling must NOT extend the session.
//
// PERFORMANCE:
//   The session row is cached in-memory per user for SESSION_CACHE_TTL_MS.
//   This eliminates the per-request SELECT on app_sessions (the dominant
//   cost on every protected request). The cleanup job still runs and revokes
//   genuinely expired sessions independently of this cache.
//
// RESILIENCE: if a session row cannot be created for a transient reason,
// the calling auth middleware still lets the (JWT-verified) user through.
// ---------------------------------------------------------------------------
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const TABLE = 'app_sessions';
const SESSION_CACHE_TTL_MS = 60_000; // 60 seconds — match the activity debounce

// In-memory cache: userId -> { session, expiresAt }
const sessionCache = new Map();

function getCachedSession(userId) {
  const entry = sessionCache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    sessionCache.delete(userId);
    return null;
  }
  return entry.session;
}

function setCachedSession(userId, session) {
  if (!session) return;
  sessionCache.set(userId, { session, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
}

function invalidateCachedSession(userId) {
  sessionCache.delete(userId);
}

/**
 * Find the user's currently active session (state = 'active').
 *  - None found: create one (post-login flow).
 *  - Found but expired past TTL: revoke, then create a new one.
 *  - Found and active: return it.
 * Uses in-memory cache to avoid a DB hit on every request.
 */
export async function ensureActiveSessionForUser(userId) {
  // 1. Check cache first.
  const cached = getCachedSession(userId);
  if (cached) {
    // Verify it's not past the inactivity TTL.
    const lastActivityMs = new Date(cached.last_activity_at).getTime();
    if (Date.now() - lastActivityMs < env.sessionTtlMs) {
      return cached;
    }
    // Expired in cache — fall through and create a fresh one.
    invalidateCachedSession(userId);
  }

  // 2. Query DB.
  const now = Date.now();
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('state', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('session lookup failed', { userId, message: error.message });
    return null;
  }

  if (!data) {
    const created = await createSession(userId);
    if (created) setCachedSession(userId, created);
    return created;
  }

  const lastActivityMs = new Date(data.last_activity_at).getTime();
  const expired = now - lastActivityMs > env.sessionTtlMs;

  if (expired) {
    await revokeSession(data.id, 'expired');
    const created = await createSession(userId);
    if (created) setCachedSession(userId, created);
    return created;
  }

  setCachedSession(userId, data);
  return data;
}

export async function createSession(userId) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.sessionTtlMs);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      user_id: userId,
      state: 'active',
      last_activity_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('session create failed', { userId, message: error.message });
    return null;
  }
  setCachedSession(userId, data);
  return data;
}

/**
 * Update the last_activity_at timestamp for a session, but only if it has not
 * been updated recently (debounced). Returns the updated session or null.
 *
 * Uses the in-memory cache to skip the SELECT-before-UPDATE round trip —
 * the cached session's last_activity_at is sufficient for the debounce check.
 */
export async function touchSession(sessionId, { force = false } = {}) {
  if (!sessionId) return null;

  // Find the cached session (avoid a SELECT round-trip).
  let current = null;
  let cachedUserId = null;
  for (const [uid, entry] of sessionCache.entries()) {
    if (entry.session?.id === sessionId) {
      current = entry.session;
      cachedUserId = uid;
      break;
    }
  }

  // Fallback: if not in cache, do a SELECT (rare).
  if (!current) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, last_activity_at, state, user_id')
      .eq('id', sessionId)
      .maybeSingle();
    if (error || !data || data.state !== 'active') return null;
    current = data;
    cachedUserId = data.user_id;
  } else if (current.state !== 'active') {
    return null;
  }

  if (!force) {
    const lastMs = new Date(current.last_activity_at).getTime();
    if (Date.now() - lastMs < env.sessionActivityDebounceMs) {
      return current; // debounced — no DB write
    }
  }

  const newExpiresAt = new Date(Date.now() + env.sessionTtlMs).toISOString();
  const newLastActivity = new Date().toISOString();
  const { data, error: updErr } = await supabaseAdmin
    .from(TABLE)
    .update({ last_activity_at: newLastActivity, expires_at: newExpiresAt })
    .eq('id', sessionId)
    .select()
    .single();

  if (updErr) {
    logger.error('session touch failed', { sessionId, message: updErr.message });
    return null;
  }

  // Update cache.
  if (cachedUserId) setCachedSession(cachedUserId, data);
  return data;
}

export async function revokeSession(sessionId, reason = 'revoked') {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({
      state: reason === 'expired' ? 'expired' : 'revoked',
      revoked_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  if (error) logger.error('session revoke failed', { sessionId, message: error.message });

  // Invalidate cache entries pointing at this session.
  for (const [uid, entry] of sessionCache.entries()) {
    if (entry.session?.id === sessionId) {
      sessionCache.delete(uid);
    }
  }
}

export async function revokeAllSessionsForUser(userId) {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({ state: 'revoked', revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('state', 'active');
  if (error) logger.error('revoke all failed', { userId, message: error.message });
  invalidateCachedSession(userId);
}

export const sessionService = {
  ensureActiveSessionForUser,
  createSession,
  touchSession,
  revokeSession,
  revokeAllSessionsForUser,
};