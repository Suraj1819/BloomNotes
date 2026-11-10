
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { supabase } from '../lib/supabaseClient.js';
import { api } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const lastUserIdRef = useRef(null);
  const mountedRef = useRef(false);
  const refreshRequestRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Refresh profile
  // ---------------------------------------------------------------------------

  const refreshProfile = useCallback(async () => {
    const requestId = ++refreshRequestRef.current;

    try {
      // apiClient already unwraps payload.data.
      const updatedProfile = await api.get('/profile');

      if (
        !updatedProfile ||
        typeof updatedProfile !== 'object' ||
        Array.isArray(updatedProfile) ||
        !updatedProfile.id
      ) {
        console.error(
          '[BloomNotes] Unexpected profile response:',
          updatedProfile
        );

        throw new Error('Invalid profile response from server.');
      }

      if (
        mountedRef.current &&
        requestId === refreshRequestRef.current
      ) {
        setProfile(updatedProfile);
      }

      return updatedProfile;
    } catch (error) {
      console.error(
        '[BloomNotes] Unable to refresh profile:',
        error
      );

      throw error;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Authentication state
  // ---------------------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const handleSession = (newSession) => {
      if (!active) return;

      const newUser = newSession?.user || null;
      const newUserId = newUser?.id || null;

      setSession(newSession);
      setUser(newUser);

      if (newUserId === lastUserIdRef.current) {
        return;
      }

      lastUserIdRef.current = newUserId;

      // Invalidate pending requests from previous sessions.
      refreshRequestRef.current += 1;

      if (newUserId) {
        setProfile(null);

        void refreshProfile().catch(() => {});
      } else {
        setProfile(null);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        handleSession(newSession);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) throw error;

        handleSession(data?.session || null);
      })
      .catch((error) => {
        if (!active) return;

        console.error(
          '[BloomNotes] Unable to get session:',
          error
        );

        refreshRequestRef.current += 1;
        lastUserIdRef.current = null;

        setSession(null);
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      mountedRef.current = false;
      refreshRequestRef.current += 1;
      subscription?.unsubscribe();
    };
  }, [refreshProfile]);

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(
        '[BloomNotes] Backend logout failed:',
        error
      );
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        '[BloomNotes] Supabase logout failed:',
        error
      );

      throw error;
    }

    refreshRequestRef.current += 1;
    lastUserIdRef.current = null;

    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Context
  // ---------------------------------------------------------------------------

  const value = {
    session,
    user,
    profile,
    loading,
    refreshProfile,
    signOut,
    setProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
}
