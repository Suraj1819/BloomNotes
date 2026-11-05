// src/lib/noteThemes.js
// The eight persistent floral note themes. The IDs match the PostgreSQL enum
// defined in supabase/migrations/0001_init.sql. NEVER reassign a note's theme
// client-side — the backend assigns it once at creation.
export const NOTE_THEMES = [
  { id: 'sakura_pink',       name: 'Sakura Pink',       swatch: '#D96A91', dark: false },
  { id: 'lavender_garden',   name: 'Lavender Garden',   swatch: '#966EC8', dark: false },
  { id: 'botanical_garden',  name: 'Botanical Garden',  swatch: '#589062', dark: false },
  { id: 'midnight_rose',     name: 'Midnight Rose',     swatch: '#D982A6', dark: true  },
  { id: 'blue_hydrangea',    name: 'Blue Hydrangea',    swatch: '#5A82C8', dark: false },
  { id: 'peach_blossom',     name: 'Peach Blossom',     swatch: '#E68264', dark: false },
  { id: 'daisy_minimal',     name: 'Daisy Minimal',     swatch: '#C8AA46', dark: false },
  { id: 'moonlit_garden',    name: 'Moonlit Garden',    swatch: '#96A0DC', dark: true  },
];

export const NOTE_THEME_IDS = NOTE_THEMES.map((t) => t.id);

export function getThemeMeta(id) {
  return NOTE_THEMES.find((t) => t.id === id) || NOTE_THEMES[0];
}
