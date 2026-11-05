// server/src/config/supabase.js
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Detect placeholder/missing config early so we get a clear error message
// instead of cryptic "fetch failed" later.
if (env.SUPABASE_URL.includes('your-project') || env.SUPABASE_URL.includes('placeholder')) {
  logger.error('================================================================');
  logger.error(' SUPABASE_URL is not configured!');
  logger.error(' Edit server/.env and set SUPABASE_URL to your real project URL');
  logger.error(' (e.g. https://abcdefgh.supabase.co)');
  logger.error('================================================================');
}

// Service-role client — server-side only. Bypasses RLS.
// NEVER expose this client or its key to the frontend.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: async (url, opts = {}) => {
      try {
        return await fetch(url, { ...opts, signal: opts.signal ?? AbortSignal.timeout(15000) });
      } catch (e) {
        const msg = e?.cause?.code || e?.cause?.hostname || e.message || 'unknown';
        logger.error('Supabase fetch failed', {
          url: typeof url === 'string' ? url : url.toString(),
          error: msg,
          hint: 'Check SUPABASE_URL in server/.env and your network/DNS',
        });
        throw e;
      }
    },
  },
});

// Anon client — used to verify user-issued JWTs without bypassing RLS.
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: async (url, opts = {}) => {
      try {
        return await fetch(url, { ...opts, signal: opts.signal ?? AbortSignal.timeout(15000) });
      } catch (e) {
        const msg = e?.cause?.code || e?.cause?.hostname || e.message || 'unknown';
        logger.error('Supabase fetch failed (anon)', {
          url: typeof url === 'string' ? url : url.toString(),
          error: msg,
          hint: 'Check SUPABASE_URL in server/.env and your network/DNS',
        });
        throw e;
      }
    },
  },
});
