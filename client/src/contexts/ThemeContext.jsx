
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { useAuth } from './AuthContext.jsx';

const ThemeContext = createContext(null);

const PARENT_THEMES = ['light', 'dark', 'system'];

const NOTE_THEMES = [
  'sakura_pink',
  'lavender_garden',
  'botanical_garden',
  'midnight_rose',
  'blue_hydrangea',
  'peach_blossom',
  'daisy_minimal',
  'moonlit_garden',
];

const DARK_NOTE_THEMES = [
  'midnight_rose',
  'moonlit_garden',
];

// Default theme is LIGHT, never SYSTEM.
function getValidParentTheme(theme) {
  return PARENT_THEMES.includes(theme)
    ? theme
    : 'light';
}

function getValidNoteTheme(theme) {
  if (!theme) return null;

  return NOTE_THEMES.includes(theme)
    ? theme
    : null;
}

// Device theme detection.
// Used only when the user explicitly selects SYSTEM.
function getSystemTheme() {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return 'light';
  }

  return window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches
    ? 'dark'
    : 'light';
}

// Apply theme to document.
function applyDocumentTheme(theme, noteTheme = null) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (noteTheme) {
    root.setAttribute('data-note-theme', noteTheme);
  } else {
    root.removeAttribute('data-note-theme');
  }

  root.setAttribute('data-theme', theme);

  root.classList.toggle('dark', theme === 'dark');

  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const { profile } = useAuth();

  // --------------------------------------------------
  // PARENT THEME
  // Default: LIGHT
  // --------------------------------------------------

  const [parentTheme, setParentThemeState] = useState(() =>
    getValidParentTheme(profile?.parent_theme)
  );

  // --------------------------------------------------
  // ACTIVE NOTE THEME
  // --------------------------------------------------

  const [activeNoteTheme, setActiveNoteThemeState] =
    useState(null);

  // --------------------------------------------------
  // SYSTEM THEME
  // --------------------------------------------------

  const [systemTheme, setSystemTheme] = useState(
    getSystemTheme
  );

  // --------------------------------------------------
  // 1. LISTEN TO SYSTEM THEME CHANGES
  // --------------------------------------------------

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    const handleSystemThemeChange = (event) => {
      setSystemTheme(
        event.matches ? 'dark' : 'light'
      );
    };

    setSystemTheme(
      mediaQuery.matches ? 'dark' : 'light'
    );

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener(
        'change',
        handleSystemThemeChange
      );

      return () => {
        mediaQuery.removeEventListener(
          'change',
          handleSystemThemeChange
        );
      };
    }

    mediaQuery.addListener(handleSystemThemeChange);

    return () => {
      mediaQuery.removeListener(handleSystemThemeChange);
    };
  }, []);

  // --------------------------------------------------
  // 2. SYNC THEME FROM USER PROFILE
  // Only valid saved preferences are applied.
  // --------------------------------------------------

  useEffect(() => {
    if (
      profile?.parent_theme &&
      PARENT_THEMES.includes(profile.parent_theme)
    ) {
      setParentThemeState(profile.parent_theme);
    }
  }, [profile?.parent_theme]);

  // --------------------------------------------------
  // 3. RESOLVE PARENT THEME
  // --------------------------------------------------

  const resolvedParent = useMemo(() => {
    if (parentTheme === 'system') {
      return systemTheme;
    }

    return parentTheme;
  }, [parentTheme, systemTheme]);

  // --------------------------------------------------
  // 4. RESOLVE ACTIVE THEME
  // --------------------------------------------------

  const resolvedTheme = useMemo(() => {
    if (!activeNoteTheme) {
      return resolvedParent;
    }

    return DARK_NOTE_THEMES.includes(activeNoteTheme)
      ? 'dark'
      : 'light';
  }, [activeNoteTheme, resolvedParent]);

  // --------------------------------------------------
  // 5. APPLY THEME TO DOCUMENT
  // --------------------------------------------------

  useEffect(() => {
    applyDocumentTheme(
      resolvedTheme,
      activeNoteTheme
    );
  }, [resolvedTheme, activeNoteTheme]);

  // --------------------------------------------------
  // 6. REDUCED MOTION
  // --------------------------------------------------

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.dataset.reducedMotion =
      String(Boolean(profile?.reduced_motion));
  }, [profile?.reduced_motion]);

  // --------------------------------------------------
  // 7. EDITOR FONT SIZE
  // --------------------------------------------------

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fontSize = Number(
      profile?.editor_font_size
    );

    const validFontSize =
      Number.isFinite(fontSize) &&
      fontSize >= 12 &&
      fontSize <= 32
        ? fontSize
        : 15;

    document.documentElement.style.setProperty(
      '--editor-font-size',
      `${validFontSize}px`
    );
  }, [profile?.editor_font_size]);

  // --------------------------------------------------
  // 8. CHANGE PARENT THEME
  // --------------------------------------------------

  const setParentTheme = useCallback((theme) => {
    setParentThemeState(
      getValidParentTheme(theme)
    );
  }, []);

  // --------------------------------------------------
  // 9. ACTIVATE NOTE THEME
  // --------------------------------------------------

  const setActiveNoteTheme = useCallback((theme) => {
    setActiveNoteThemeState(
      getValidNoteTheme(theme)
    );
  }, []);

  // --------------------------------------------------
  // 10. CLEAR NOTE THEME
  // --------------------------------------------------

  const clearActiveNoteTheme = useCallback(() => {
    setActiveNoteThemeState(null);
  }, []);

  // --------------------------------------------------
  // 11. CONTEXT VALUE
  // --------------------------------------------------

  const value = useMemo(() => ({
    parentTheme,
    setParentTheme,

    resolvedParent,
    resolvedTheme,
    systemTheme,

    activeNoteTheme,
    setActiveNoteTheme,
    clearActiveNoteTheme,

    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',

    isSystem: parentTheme === 'system',
    hasActiveNoteTheme: Boolean(activeNoteTheme),

    availableParentThemes: PARENT_THEMES,
    availableNoteThemes: NOTE_THEMES,
  }), [
    parentTheme,
    setParentTheme,
    resolvedParent,
    resolvedTheme,
    systemTheme,
    activeNoteTheme,
    setActiveNoteTheme,
    clearActiveNoteTheme,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ------------------------------------------------------
// USE THEME HOOK
// ------------------------------------------------------

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within ThemeProvider'
    );
  }

  return context;
}
