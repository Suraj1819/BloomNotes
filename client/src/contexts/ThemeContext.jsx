// src/contexts/ThemeContext.jsx
// Centralized ThemeProvider.
//   - parent theme: 'light' | 'dark' | 'system'  (persisted on profile)
//   - active note theme: one of eight IDs        (transient — only while a note is open)
//
// Behavior:
//   - Opening a note calls setActiveNoteTheme(id) -> sets <html data-note-theme="id">.
//     The note theme overrides parent tokens for ALL surfaces.
//   - Closing a note calls setActiveNoteTheme(null) -> restores parent theme.
//   - Parent preference is never overwritten by note themes.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';

const ThemeContext = createContext(null);

function resolveSystem() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const { profile } = useAuth();
  const [parentTheme, setParentTheme] = useState('system');
  const [activeNoteTheme, setActiveNoteThemeState] = useState(null);
  const [systemDark, setSystemDark] = useState(resolveSystem());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Pull parent preference from profile when available.
  useEffect(() => {
    if (profile?.parent_theme) setParentTheme(profile.parent_theme);
  }, [profile?.parent_theme]);

  // Reduced motion + editor font size.
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(!!profile?.reduced_motion);
  }, [profile?.reduced_motion]);

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${profile?.editor_font_size || 15}px`);
  }, [profile?.editor_font_size]);

  // Apply the resolved theme.
  const resolvedParent = parentTheme === 'system' ? (systemDark ? 'dark' : 'light') : parentTheme;

  useEffect(() => {
    if (activeNoteTheme) {
      document.documentElement.setAttribute('data-note-theme', activeNoteTheme);
      // While a note theme is active, also keep data-theme synced to the note
      // theme's light/dark variant so color-scheme + utilities are consistent.
      const noteIsDark = ['midnight_rose', 'moonlit_garden'].includes(activeNoteTheme);
      document.documentElement.setAttribute('data-theme', noteIsDark ? 'dark' : 'light');
    } else {
      document.documentElement.removeAttribute('data-note-theme');
      document.documentElement.setAttribute('data-theme', resolvedParent);
    }
  }, [activeNoteTheme, resolvedParent]);

  const setActiveNoteTheme = useCallback((id) => {
    setActiveNoteThemeState(id);
  }, []);

  const clearActiveNoteTheme = useCallback(() => {
    setActiveNoteThemeState(null);
  }, []);

  const setParent = useCallback((t) => {
    setParentTheme(t);
  }, []);

  const value = useMemo(() => ({
    parentTheme,
    setParentTheme: setParent,
    resolvedParent,
    activeNoteTheme,
    setActiveNoteTheme,
    clearActiveNoteTheme,
  }), [parentTheme, resolvedParent, activeNoteTheme, setActiveNoteTheme, clearActiveNoteTheme, setParent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
