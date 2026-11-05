// server/src/controllers/authController.js
import { supabaseAnon } from '../config/supabase.js';
import { sessionService } from '../services/sessionService.js';
import { ok } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/error.js';

// POST /api/v1/auth/activity
// Genuine user-activity signal — extends the 24h inactivity session.
// Must NOT be called by background processes (autosave, polling).
export const postActivity = asyncHandler(async (req, res) => {
  if (req.background) return ok(res, { ok: true });
  if (!req.user || !req.session) throw ApiError.unauthorized();
  const updated = await sessionService.touchSession(req.session.id, { force: true });
  return ok(res, { ok: true, session: updated });
});

// GET /api/v1/auth/session
export const getSession = asyncHandler(async (req, res) => {
  return ok(res, { user: { id: req.user.id, email: req.user.email }, session: req.session });
});

// POST /api/v1/auth/logout
export const postLogout = asyncHandler(async (req, res) => {
  // Revoke application session (server-side) — independent of Supabase token.
  if (req.session) {
    await sessionService.revokeSession(req.session.id, 'logout');
  }
  // Best-effort sign out of Supabase on the server (token is short-lived).
  if (req.accessToken) {
    try { await supabaseAnon.auth.signOut(req.accessToken); } catch { /* ignore */ }
  }
  return ok(res, { ok: true });
});

// Internal: create initial session after Supabase login (called from login route, optional).
export async function ensureSession(userId) {
  return sessionService.ensureActiveSessionForUser(userId);
}
