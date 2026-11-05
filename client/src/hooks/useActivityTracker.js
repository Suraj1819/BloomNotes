// src/hooks/useActivityTracker.js
// Tracks GENUINE user activity (mousemove, click, keydown, touch, scroll, visibility)
// and periodically POSTs to /auth/activity so the backend can extend the
// 24-hour inactivity session.
//
// IMPORTANT: this only sends genuine user-activity signals. Background
// processes (autosave, polling, query invalidation) NEVER call this hook's
// sender — they use apiClient directly with isBackground: true.
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/apiClient.js';

const DEBOUNCE_MS = 60_000;       // at most one activity ping per minute

export function useActivityTracker() {
  const { user } = useAuth();
  const lastSentRef = useRef(0);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const send = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastSentRef.current < DEBOUNCE_MS) return;
      if (pendingRef.current) return;
      lastSentRef.current = now;
      pendingRef.current = true;
      try {
        // Marked as background from the network layer's perspective (don't
        // trigger the 401 redirect), but the BACKEND route /auth/activity
        // explicitly DOES count this as genuine activity.
        await api.post('/auth/activity', {}, { isBackground: true });
      } catch { /* ignore — background */ }
      finally { pendingRef.current = false; }
    };

    const onActivity = () => send(false);
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') send(true);
    });

    // Initial check on mount in case the user just returned.
    send(true);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [user]);
}
