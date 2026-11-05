// server/server.js
import app from './app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

// Background job: revoke sessions that have exceeded the 24h inactivity TTL.
// Runs every 5 minutes. Genuine activity updates `last_activity_at`; this job
// marks expired sessions as 'expired' so subsequent protected API requests 401.
import './src/jobs/sessionCleanup.js';
import './src/jobs/reminderNotifier.js';

const server = app.listen(env.port, () => {
  logger.info(`BloomNotes API listening on port ${env.port} (${env.NODE_ENV})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    logger.info(`${sig} received, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
