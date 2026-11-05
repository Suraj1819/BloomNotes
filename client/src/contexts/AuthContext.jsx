// src/contexts/AuthContext.jsx
// Holds the Supabase session + the user's profile (parent theme, settings).
//
// Performance notes:
//   - `onAuthStateChange` fires for many reasons (token refresh, sign in,
//     sign out, etc.). We only refetch the profile when the *user id* actually
//     changes — this avoids redundant /profile calls on every token refresh.
//   - The profile is cached on the client too — we never refetch if we already
//     have one for the current user (unless `refreshProfile()` is called
//     explicitly, e.g. after saving settings).
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { api } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef(null);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await api.get('/profile');
      setProfile(p);
      return p;
    } catch (e) {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const s = data.session;
      setSession(s);
      setUser(s?.user || null);
      lastUserIdRef.current = s?.user?.id || null;
      if (s?.user) await refreshProfile();
      setLoading(false);
    });

    // Only refetch profile when the user identity changes (login/logout).
    // Token refresh events reuse the existing profile — no need to refetch.
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      const newUser = newSession?.user || null;
      const newUserId = newUser?.id || null;

      setSession(newSession);
      setUser(newUser);

      // Only refetch profile if the user identity actually changed.
      if (newUserId !== lastUserIdRef.current) {
        lastUserIdRef.current = newUserId;
        if (newUser) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    lastUserIdRef.current = null;
  }, []);

  const value = {
    session,
    user,
    profile,
    loading,
    refreshProfile,
    signOut,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}