
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { useAuth } from './AuthContext.jsx';


// ======================================================
// THEME CONTEXT
// ======================================================

const ThemeContext = createContext(null);


// ======================================================
// THEME CONFIGURATION
// ======================================================

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


// ======================================================
// VALIDATION
// ======================================================

function getValidParentTheme(theme) {
  return PARENT_THEMES.includes(theme)
    ? theme
    : 'system';
}

function getValidNoteTheme(theme) {
  if (!theme) return null;

  return NOTE_THEMES.includes(theme)
    ? theme
    : null;
}


// ======================================================
// SYSTEM THEME
// ======================================================

function getSystemTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  if (typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches
    ? 'dark'
    : 'light';
}


// ======================================================
// APPLY THEME TO DOCUMENT
// ======================================================

function applyDocumentTheme(theme, noteTheme = null) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set active note theme.
  if (noteTheme) {
    root.setAttribute('data-note-theme', noteTheme);
  } else {
    root.removeAttribute('data-note-theme');
  }

  // Set resolved light/dark theme.
  root.setAttribute('data-theme', theme);

  // Tailwind dark mode compatibility.
  root.classList.toggle('dark', theme === 'dark');

  // Browser native controls compatibility.
  root.style.colorScheme = theme;
}


// ======================================================
// THEME PROVIDER
// ======================================================

export function ThemeProvider({ children }) {
  const { profile } = useAuth();


  // ----------------------------------------------------
  // PARENT THEME
  // ----------------------------------------------------

  const [parentTheme, setParentThemeState] = useState(() =>
    getValidParentTheme(profile?.parent_theme)
  );


  // ----------------------------------------------------
  // ACTIVE NOTE THEME
  // ----------------------------------------------------

  const [activeNoteTheme, setActiveNoteThemeState] =
    useState(null);


  // ----------------------------------------------------
  // SYSTEM THEME
  // ----------------------------------------------------

  const [systemTheme, setSystemTheme] = useState(
    getSystemTheme
  );


  // ====================================================
  // 1. LISTEN TO SYSTEM THEME CHANGES
  // ====================================================

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

    // Initial synchronization.
    setSystemTheme(
      mediaQuery.matches ? 'dark' : 'light'
    );

    // Modern browser.
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

    // Older browser fallback.
    mediaQuery.addListener(
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeListener(
        handleSystemThemeChange
      );
    };
  }, []);


  // ====================================================
  // 2. SYNC PARENT THEME FROM PROFILE
  // ====================================================

  useEffect(() => {
    if (profile?.parent_theme) {
      setParentThemeState(
        getValidParentTheme(profile.parent_theme)
      );
    }
  }, [profile?.parent_theme]);


  // ====================================================
  // 3. RESOLVE PARENT THEME
  // ====================================================

  const resolvedParent = useMemo(() => {
    if (parentTheme === 'system') {
      return systemTheme;
    }

    return parentTheme;
  }, [parentTheme, systemTheme]);


  // ====================================================
  // 4. RESOLVE ACTIVE THEME
  // ====================================================

  const resolvedTheme = useMemo(() => {
    if (!activeNoteTheme) {
      return resolvedParent;
    }

    return DARK_NOTE_THEMES.includes(activeNoteTheme)
      ? 'dark'
      : 'light';
  }, [activeNoteTheme, resolvedParent]);


  // ====================================================
  // 5. APPLY THEME TO HTML
  // ====================================================

  useEffect(() => {
    applyDocumentTheme(
      resolvedTheme,
      activeNoteTheme
    );
  }, [resolvedTheme, activeNoteTheme]);


  // ====================================================
  // 6. REDUCED MOTION
  // ====================================================

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.dataset.reducedMotion =
      String(Boolean(profile?.reduced_motion));
  }, [profile?.reduced_motion]);


  // ====================================================
  // 7. EDITOR FONT SIZE
  // ====================================================

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


  // ====================================================
  // 8. CHANGE PARENT THEME
  // ====================================================

  const setParentTheme = useCallback((theme) => {
    const validTheme = getValidParentTheme(theme);

    setParentThemeState(validTheme);
  }, []);


  // ====================================================
  // 9. ACTIVATE NOTE THEME
  // ====================================================

  const setActiveNoteTheme = useCallback((theme) => {
    const validTheme = getValidNoteTheme(theme);

    setActiveNoteThemeState(validTheme);
  }, []);


  // ====================================================
  // 10. CLEAR NOTE THEME
  // ====================================================

  const clearActiveNoteTheme = useCallback(() => {
    setActiveNoteThemeState(null);
  }, []);


  // ====================================================
  // 11. CONTEXT VALUE
  // ====================================================

  const value = useMemo(() => ({
    // User preference.
    parentTheme,

    setParentTheme,

    // Actual resolved parent preference.
    resolvedParent,

    // Current theme applied to the application.
    resolvedTheme,

    // Device preference.
    systemTheme,

    // Active note theme.
    activeNoteTheme,

    setActiveNoteTheme,

    clearActiveNoteTheme,

    // Theme information.
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


  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}


// ======================================================
// USE THEME HOOK
// ======================================================

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within ThemeProvider'
    );
  }

  return context;
}
