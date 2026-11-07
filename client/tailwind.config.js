
/** @type {import('tailwindcss').Config} */

export default {
  // --------------------------------------------------
  // PROJECT FILES
  // --------------------------------------------------

  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  // --------------------------------------------------
  // DARK MODE
  // Supports data-theme="dark"
  // --------------------------------------------------

  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {

      // ------------------------------------------------
      // COLORS — CSS VARIABLE BASED
      // ------------------------------------------------

      colors: {
        // Background
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--c-bg-secondary) / <alpha-value>)',

        // Surfaces
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',

        // Brand colors
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-2': 'rgb(var(--c-accent-2) / <alpha-value>)',

        // Typography
        'text-main': 'rgb(var(--c-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--c-text-muted) / <alpha-value>)',

        // Borders and inputs
        border: 'rgb(var(--c-border) / <alpha-value>)',
        highlight: 'rgb(var(--c-highlight) / <alpha-value>)',
        input: 'rgb(var(--c-input) / <alpha-value>)',

        // Status colors
        success: 'rgb(var(--c-success) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        info: 'rgb(var(--c-info) / <alpha-value>)',

        // Overlay
        overlay: 'rgb(var(--c-overlay) / <alpha-value>)',
      },


      // ------------------------------------------------
      // BORDER RADIUS
      // ------------------------------------------------

      borderRadius: {
        xl2: '1rem',
        xl3: '1.25rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },


      // ------------------------------------------------
      // SHADOWS
      // ------------------------------------------------

      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        hover: 'var(--shadow-hover)',
        focus: 'var(--shadow-focus)',
      },


      // ------------------------------------------------
      // TYPOGRAPHY
      // One consistent font throughout the application
      // ------------------------------------------------

      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],

        serif: [
          'Georgia',
          'serif',
        ],
      },


      // ------------------------------------------------
      // TRANSITIONS
      // ------------------------------------------------

      transitionTimingFunction: {
        floral: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },


      // ------------------------------------------------
      // Z-INDEX
      // ------------------------------------------------

      zIndex: {
        60: '60',
        70: '70',
        80: '80',
      },


      // ------------------------------------------------
      // BACKDROP BLUR
      // ------------------------------------------------

      backdropBlur: {
        xs: '2px',
      },

    },
  },

  // --------------------------------------------------
  // PLUGINS
  // --------------------------------------------------

  plugins: [],
};
