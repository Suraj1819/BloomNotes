
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

const DEFAULTS = {
  parentTheme: 'light',
  floralIntensity: 60,
  floatingPetals: true,
  reducedMotion: false,
  editorFontSize: 15,
};

function getValidParentTheme(theme) {
  return PARENT_THEMES.includes(theme)
    ? theme
    : DEFAULTS.parentTheme;
}

function getValidNoteTheme(theme) {
  if (!theme) return null;

  return NOTE_THEMES.includes(theme)
    ? theme
    : null;
}

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

function getValidNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
}

function applyDocumentTheme(theme, noteTheme = null) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  if (noteTheme) {
    root.setAttribute('data-note-theme', noteTheme);
  } else {
    root.removeAttribute('data-note-theme');
  }
}

export function ThemeProvider({ children }) {
  const { profile } = useAuth();

  // --------------------------------------------------
  // PARENT THEME
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
  // PROFILE SETTINGS
  // --------------------------------------------------

  const floralIntensity = getValidNumber(
    profile?.floral_intensity,
    0,
    100,
    DEFAULTS.floralIntensity
  );

  const floatingPetals =
    typeof profile?.floating_petals === 'boolean'
      ? profile.floating_petals
      : DEFAULTS.floatingPetals;

  const reducedMotion =
    typeof profile?.reduced_motion === 'boolean'
      ? profile.reduced_motion
      : DEFAULTS.reducedMotion;

  const editorFontSize = getValidNumber(
    profile?.editor_font_size,
    12,
    32,
    DEFAULTS.editorFontSize
  );

  // --------------------------------------------------
  // 1. SYSTEM THEME LISTENER
  // --------------------------------------------------

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

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
  // 2. SYNC PARENT THEME FROM PROFILE
  // --------------------------------------------------

  useEffect(() => {
    if (!profile) return;

    setParentThemeState(
      getValidParentTheme(profile.parent_theme)
    );
  }, [profile?.parent_theme]);

  // --------------------------------------------------
  // 3. RESOLVE PARENT THEME
  // --------------------------------------------------

  const resolvedParent = useMemo(() => {
    return parentTheme === 'system'
      ? systemTheme
      : parentTheme;
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
  // 5. APPLY DOCUMENT THEME
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

    const root = document.documentElement;

    root.dataset.reducedMotion = String(reducedMotion);

    root.classList.toggle(
      'reduced-motion',
      reducedMotion
    );
  }, [reducedMotion]);

  // --------------------------------------------------
  // 7. FLORAL SETTINGS
  // --------------------------------------------------

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    root.style.setProperty(
      '--floral-intensity',
      String(floralIntensity / 100)
    );

    root.style.setProperty(
      '--petal-opacity',
      String((floralIntensity / 100) * 0.72)
    );

    root.dataset.floatingPetals = String(floatingPetals);
    root.dataset.floralIntensity = String(floralIntensity);
  }, [floralIntensity, floatingPetals]);

  // --------------------------------------------------
  // 8. EDITOR FONT SIZE
  // --------------------------------------------------

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.style.setProperty(
      '--editor-font-size',
      `${editorFontSize}px`
    );
  }, [editorFontSize]);

  // --------------------------------------------------
  // 9. CHANGE PARENT THEME
  // --------------------------------------------------

  const setParentTheme = useCallback((theme) => {
    setParentThemeState(
      getValidParentTheme(theme)
    );
  }, []);

  // --------------------------------------------------
  // 10. ACTIVATE NOTE THEME
  // --------------------------------------------------

  const setActiveNoteTheme = useCallback((theme) => {
    setActiveNoteThemeState(
      getValidNoteTheme(theme)
    );
  }, []);

  // --------------------------------------------------
  // 11. CLEAR NOTE THEME
  // --------------------------------------------------

  const clearActiveNoteTheme = useCallback(() => {
    setActiveNoteThemeState(null);
  }, []);

  // --------------------------------------------------
  // 12. CONTEXT VALUE
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

    floralIntensity,
    floatingPetals,
    reducedMotion,
    editorFontSize,

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
    floralIntensity,
    floatingPetals,
    reducedMotion,
    editorFontSize,
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
