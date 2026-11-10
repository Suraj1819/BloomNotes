// server/src/services/profileService.js
// Profile CRUD, validated preferences and private avatar storage.

import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const PROFILE_CACHE_TTL_MS = 5 * 60_000;
const AVATAR_BUCKET = 'bloomnotes-vault';
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_PROFILE_FIELDS = new Set([
  'full_name',
  'phone',
  'parent_theme',
  'floral_intensity',
  'reduced_motion',
  'floating_petals',
  'editor_font_size',
  'autosave_enabled',
  'default_landing_page',
  'notif_reminders',
  'notif_account',
]);

const VALID_PARENT_THEMES = new Set(['light', 'dark', 'system']);

const VALID_LANDING_PAGES = new Set([
  'dashboard',
  'notes',
  'journal',
  'personal-space',
]);

const BOOLEAN_SETTINGS = [
  'reduced_motion',
  'floating_petals',
  'autosave_enabled',
  'notif_reminders',
  'notif_account',
];

const profileCache = new Map();

// -----------------------------------------------------------------------------
// Cache
// -----------------------------------------------------------------------------

function getCachedProfile(userId) {
  const entry = profileCache.get(userId);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    profileCache.delete(userId);
    return null;
  }

  return entry.profile;
}

function setCachedProfile(userId, profile) {
  if (!profile) return;

  // Cache permanent storage path, never a time-limited signed URL.
  profileCache.set(userId, {
    profile: { ...profile },
    expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
  });
}

function invalidateCachedProfile(userId) {
  profileCache.delete(userId);
}

// -----------------------------------------------------------------------------
// Profile validation
// -----------------------------------------------------------------------------

function sanitizeProfilePatch(patch = {}) {
  if (
    !patch ||
    typeof patch !== 'object' ||
    Array.isArray(patch)
  ) {
    throw ApiError.badRequest('Invalid profile update payload.');
  }

  const safePatch = {};

  for (const [key, value] of Object.entries(patch)) {
    // Ignore fields outside the explicit allowlist.
    // id, email and avatar_url cannot be changed here.
    if (ALLOWED_PROFILE_FIELDS.has(key)) {
      safePatch[key] = value;
    }
  }

  if ('full_name' in safePatch) {
    if (typeof safePatch.full_name !== 'string') {
      throw ApiError.badRequest('Full name must be a string.');
    }

    const fullName = safePatch.full_name.trim();

    if (fullName.length < 2 || fullName.length > 120) {
      throw ApiError.badRequest(
        'Full name must be between 2 and 120 characters.'
      );
    }

    safePatch.full_name = fullName;
  }

  if ('phone' in safePatch) {
    const phone = safePatch.phone;

    if (
      phone !== null &&
      (typeof phone !== 'string' || phone.trim().length > 20)
    ) {
      throw ApiError.badRequest(
        'Phone number must be a string of at most 20 characters.'
      );
    }

    safePatch.phone =
      typeof phone === 'string' ? phone.trim() : null;
  }

  if ('parent_theme' in safePatch) {
    if (
      typeof safePatch.parent_theme !== 'string' ||
      !VALID_PARENT_THEMES.has(safePatch.parent_theme)
    ) {
      throw ApiError.badRequest('Invalid parent theme.');
    }
  }

  if ('default_landing_page' in safePatch) {
    if (
      typeof safePatch.default_landing_page !== 'string' ||
      !VALID_LANDING_PAGES.has(safePatch.default_landing_page)
    ) {
      throw ApiError.badRequest('Invalid default landing page.');
    }
  }

  if ('floral_intensity' in safePatch) {
    const intensity = Number(safePatch.floral_intensity);

    if (
      !Number.isInteger(intensity) ||
      intensity < 0 ||
      intensity > 100
    ) {
      throw ApiError.badRequest(
        'Floral intensity must be an integer from 0 to 100.'
      );
    }

    safePatch.floral_intensity = intensity;
  }

  if ('editor_font_size' in safePatch) {
    const fontSize = Number(safePatch.editor_font_size);

    if (
      !Number.isInteger(fontSize) ||
      fontSize < 12 ||
      fontSize > 32
    ) {
      throw ApiError.badRequest(
        'Editor font size must be an integer from 12 to 32.'
      );
    }

    safePatch.editor_font_size = fontSize;
  }

  for (const field of BOOLEAN_SETTINGS) {
    if (
      field in safePatch &&
      typeof safePatch[field] !== 'boolean'
    ) {
      throw ApiError.badRequest(`${field} must be a boolean.`);
    }
  }

  return safePatch;
}

// -----------------------------------------------------------------------------
// Avatar URL
// -----------------------------------------------------------------------------

async function withAvatarUrl(profile) {
  if (!profile) return profile;

  const avatarPath = profile.avatar_url;

  if (!avatarPath) {
    return { ...profile, avatar_url: null };
  }

  // Compatibility with old public/external URLs.
  if (/^https?:\/\//i.test(avatarPath)) {
    return { ...profile };
  }

  const { data, error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(
      avatarPath,
      SIGNED_URL_TTL_SECONDS
    );

  if (error) {
    // A missing/old avatar should not prevent profile loading.
    return { ...profile, avatar_url: null };
  }

  return {
    ...profile,
    avatar_url: data?.signedUrl || null,
  };
}

// -----------------------------------------------------------------------------
// Get profile
// -----------------------------------------------------------------------------

export async function getProfile(userId) {
  let profile = getCachedProfile(userId);

  if (!profile) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw ApiError.internal(error.message);
    }

    if (!data) {
      const {
        data: createdProfile,
        error: createError,
      } = await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: userId },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (createError) {
        throw ApiError.internal(createError.message);
      }

      profile = createdProfile;
    } else {
      profile = data;
    }

    setCachedProfile(userId, profile);
  }

  return withAvatarUrl(profile);
}

// -----------------------------------------------------------------------------
// Update profile and preferences
// -----------------------------------------------------------------------------

export async function updateProfile(userId, patch) {
  const safePatch = sanitizeProfilePatch(patch);

  if (Object.keys(safePatch).length === 0) {
    return getProfile(userId);
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: userId,
        ...safePatch,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    throw ApiError.internal(error.message);
  }

  invalidateCachedProfile(userId);
  setCachedProfile(userId, data);

  return withAvatarUrl(data);
}

// -----------------------------------------------------------------------------
// Upload avatar
// -----------------------------------------------------------------------------

export async function uploadAvatar(userId, file) {
  if (!file?.buffer?.length) {
    throw ApiError.badRequest(
      'No avatar image was received.'
    );
  }

  const extensionByType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const extension = extensionByType[file.mimetype];

  if (!extension) {
    throw ApiError.badRequest(
      'Only JPG, PNG and WebP images are allowed.'
    );
  }

  if (file.buffer.length > MAX_AVATAR_SIZE) {
    throw ApiError.badRequest(
      'Avatar image must be 5 MB or smaller.'
    );
  }

  const {
    data: current,
    error: currentError,
  } = await supabaseAdmin
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (currentError) {
    throw ApiError.internal(currentError.message);
  }

  const oldPath =
    current?.avatar_url &&
    !/^https?:\/\//i.test(current.avatar_url)
      ? current.avatar_url
      : null;

  const newPath = `${userId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(newPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw ApiError.internal(
      `Avatar upload failed: ${uploadError.message}`
    );
  }

  const {
    data: updated,
    error: updateError,
  } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: userId,
        avatar_url: newPath,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (updateError) {
    await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .remove([newPath]);

    throw ApiError.internal(
      `Could not save avatar path: ${updateError.message}`
    );
  }

  // Remove previous avatar after the new one is saved.
  if (oldPath && oldPath !== newPath) {
    const { error: removeError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .remove([oldPath]);

    if (removeError) {
      console.warn(
        '[BloomNotes] Could not remove previous avatar:',
        removeError.message
      );
    }
  }

  invalidateCachedProfile(userId);
  setCachedProfile(userId, updated);

  return withAvatarUrl(updated);
}

// -----------------------------------------------------------------------------
// Delete account
// -----------------------------------------------------------------------------

export async function deleteAccount(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    throw ApiError.internal(error.message);
  }

  invalidateCachedProfile(userId);

  return true;
}