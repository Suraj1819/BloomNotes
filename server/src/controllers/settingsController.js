
// server/src/controllers/settingsController.js
// Handles reading and updating user preferences.

import * as profileService from '../services/profileService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

const SETTINGS_FIELDS = [
  'parent_theme',
  'floral_intensity',
  'reduced_motion',
  'floating_petals',
  'editor_font_size',
  'autosave_enabled',
  'default_landing_page',
  'notif_reminders',
  'notif_account',
];

const DEFAULT_SETTINGS = {
  parent_theme: 'system',
  floral_intensity: 50,
  reduced_motion: false,
  floating_petals: true,
  editor_font_size: 16,
  autosave_enabled: true,
  default_landing_page: 'dashboard',
  notif_reminders: true,
  notif_account: true,
};

function pickSettings(profile = {}) {
  return Object.fromEntries(
    SETTINGS_FIELDS.map((field) => [
      field,
      profile[field] ?? DEFAULT_SETTINGS[field],
    ])
  );
}

// GET /settings
export const getSettings = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);

  return ok(res, pickSettings(profile));
});

// PATCH /settings or PUT /settings
export const updateSettings = asyncHandler(async (req, res) => {
  if (
    !req.body ||
    typeof req.body !== 'object' ||
    Array.isArray(req.body)
  ) {
    throw new Error('Invalid settings payload.');
  }

  // Only accept settings fields. Ignore unrelated profile properties.
  const settingsPatch = Object.fromEntries(
    Object.entries(req.body).filter(([key]) =>
      SETTINGS_FIELDS.includes(key)
    )
  );

  if (Object.keys(settingsPatch).length === 0) {
    const profile = await profileService.getProfile(req.user.id);
    return ok(res, pickSettings(profile));
  }

  const updatedProfile = await profileService.updateProfile(
    req.user.id,
    settingsPatch
  );

  return ok(res, pickSettings(updatedProfile));
});
