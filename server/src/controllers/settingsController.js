// server/src/controllers/settingsController.js
// Settings are stored on the profile row, so this is a thin alias.
import * as profileService from '../services/profileService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

export const getSettings = asyncHandler(async (req, res) => {
  const p = await profileService.getProfile(req.user.id);
  return ok(res, {
    parent_theme: p.parent_theme,
    floral_intensity: p.floral_intensity,
    reduced_motion: p.reduced_motion,
    floating_petals: p.floating_petals,
    editor_font_size: p.editor_font_size,
    autosave_enabled: p.autosave_enabled,
    default_landing_page: p.default_landing_page,
    notif_reminders: p.notif_reminders,
    notif_account: p.notif_account,
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const p = await profileService.updateProfile(req.user.id, req.body);
  return ok(res, {
    parent_theme: p.parent_theme,
    floral_intensity: p.floral_intensity,
    reduced_motion: p.reduced_motion,
    floating_petals: p.floating_petals,
    editor_font_size: p.editor_font_size,
    autosave_enabled: p.autosave_enabled,
    default_landing_page: p.default_landing_page,
    notif_reminders: p.notif_reminders,
    notif_account: p.notif_account,
  });
});
