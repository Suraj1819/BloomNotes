// server/src/middleware/activity.js
// Marks a request as a "genuine user activity" signal that may extend the
// 24-hour inactivity session. Mount BEFORE requireAuth on user-facing routes
// (NOT on background/polling routes like autosave).
//
// If req.session is null (transient session lookup failure), we still try to
// create one on the fly — but we never block a genuine user request because
// of session bookkeeping.
import { asyncHandler } from './error.js';
import { sessionService } from '../services/sessionService.js';

export const trackActivity = asyncHandler(async (req, _res, next) => {
  // Background requests (autosave, polling) must NOT extend the session.
  if (req.background) return next();
  if (!req.user) return next();

  // Ensure a session exists; if missing, create one on the fly.
  if (!req.session) {
    try {
      req.session = await sessionService.ensureActiveSessionForUser(req.user.id);
    } catch { /* ignore — best effort */ }
  }
  if (req.session) {
    await sessionService.touchSession(req.session.id);
  }
  next();
});
