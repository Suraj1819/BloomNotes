// server/src/jobs/sessionCleanup.js
// Periodically marks sessions whose last_activity_at is older than the
// 24-hour TTL as 'expired'. Genuine user activity (via POST /auth/activity)
// is what keeps a session alive — this job is a safety net only and does
// NOT itself extend any session.
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const INTERVAL_MS = 5 * 60 * 1000;
const TTL_MS = env.sessionTtlMs;

async function cleanup() {
  try {
    const cutoff = new Date(Date.now() - TTL_MS).toISOString();
    const { data, error } = await supabaseAdmin
      .from('app_sessions')
      .update({ state: 'expired', revoked_at: new Date().toISOString() })
      .eq('state', 'active')
      .lt('last_activity_at', cutoff)
      .select('id');
    if (error) {
      logger.error('session cleanup error', { message: error.message });
    } else if (data && data.length) {
      logger.info('sessions expired', { count: data.length });
    }
  } catch (e) {
    logger.error('session cleanup failed', { message: e.message });
  }
}

cleanup();
setInterval(cleanup, INTERVAL_MS);
logger.info('session cleanup job scheduled', { intervalMs: INTERVAL_MS, ttlMs: TTL_MS });
