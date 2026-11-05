// server/src/jobs/reminderNotifier.js
// Scans for reminders that are due and creates a notification row.
// Real-time push requires an external worker; for the free-tier this job
// generates notifications server-side. The frontend can then poll
// /notifications periodically (polling does NOT extend the session).
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

const INTERVAL_MS = 60 * 1000; // every minute

async function processDueReminders() {
  try {
    const nowIso = new Date().toISOString();
    const { data: due, error } = await supabaseAdmin
      .from('reminders')
      .select('id,user_id,title,remind_at')
      .eq('status', 'pending')
      .lte('remind_at', nowIso)
      .limit(200);
    if (error) { logger.error('reminder scan error', { message: error.message }); return; }
    if (!due || !due.length) return;

    const notifs = due.map((r) => ({
      user_id: r.user_id,
      kind: 'reminder',
      title: `Reminder: ${r.title}`,
      body: `Scheduled for ${new Date(r.remind_at).toLocaleString()}`,
      link: `/reminders`,
    }));

    const { error: ne } = await supabaseAdmin.from('notifications').insert(notifs);
    if (ne) { logger.error('notification insert error', { message: ne.message }); return; }

    // Mark reminders as done so we don't re-notify.
    const ids = due.map((r) => r.id);
    const { error: ue } = await supabaseAdmin.from('reminders').update({ status: 'done' }).in('id', ids);
    if (ue) logger.error('reminder mark-done error', { message: ue.message });
    else logger.info('reminders processed', { count: ids.length });
  } catch (e) {
    logger.error('reminder job failed', { message: e.message });
  }
}

processDueReminders();
setInterval(processDueReminders, INTERVAL_MS);
logger.info('reminder notifier job scheduled', { intervalMs: INTERVAL_MS });
