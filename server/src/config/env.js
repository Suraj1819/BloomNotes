// server/src/config/env.js
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.string().default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_ANON_KEY: z.string().min(20, 'SUPABASE_ANON_KEY is required'),
  SESSION_TTL_MS: z.string().default('86400000'),
  SESSION_ACTIVITY_DEBOUNCE_MS: z.string().default('60000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('300'),
  VAULT_MAX_FILE_SIZE: z.string().default('26214400'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  port: parseInt(parsed.data.PORT, 10),
  sessionTtlMs: parseInt(parsed.data.SESSION_TTL_MS, 10),
  sessionActivityDebounceMs: parseInt(parsed.data.SESSION_ACTIVITY_DEBOUNCE_MS, 10),
  rateLimitWindowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
  rateLimitMax: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
  vaultMaxFileSize: parseInt(parsed.data.VAULT_MAX_FILE_SIZE, 10),
  isProd: parsed.data.NODE_ENV === 'production',
};
