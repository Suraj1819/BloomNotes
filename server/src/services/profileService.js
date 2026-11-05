// server/src/services/profileService.js
// Profile CRUD and private avatar storage.

import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const PROFILE_CACHE_TTL_MS = 5 * 60_000;
const AVATAR_BUCKET = 'bloomnotes-vault';
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const profileCache = new Map();

function getCachedProfile(userId) {
  const entry = profileCache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    profileCache.delete(userId);
    return null;
  }
  return entry.profile;
}

function setCachedProfile(userId, profile) {
  if (!profile) return;
  // Cache the permanent storage path, never a time-limited signed URL.
  profileCache.set(userId, {
    profile: { ...profile },
    expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
  });
}

function invalidateCachedProfile(userId) {
  profileCache.delete(userId);
}

async function withAvatarUrl(profile) {
  if (!profile) return profile;

  const avatarPath = profile.avatar_url;
  if (!avatarPath) return { ...profile, avatar_url: null };

  // Keep compatibility with old public/external URLs if any were stored.
  if (/^https?:\/\//i.test(avatarPath)) return { ...profile };

  const { data, error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(avatarPath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    // A missing/old avatar should not prevent the profile from loading.
    return { ...profile, avatar_url: null };
  }

  return { ...profile, avatar_url: data?.signedUrl || null };
}

export async function getProfile(userId) {
  let profile = getCachedProfile(userId);

  if (!profile) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw ApiError.internal(error.message);

    if (!data) {
      const { data: createdProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id' })
        .select('*')
        .single();

      if (createError) throw ApiError.internal(createError.message);
      profile = createdProfile;
    } else {
      profile = data;
    }

    setCachedProfile(userId, profile);
  }

  return withAvatarUrl(profile);
}

export async function updateProfile(userId, patch) {
  // Avatar paths can only be changed through the authenticated upload endpoint.
  const safePatch = { ...patch };
  delete safePatch.avatar_url;
  delete safePatch.id;
  delete safePatch.email;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, ...safePatch }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw ApiError.internal(error.message);

  invalidateCachedProfile(userId);
  setCachedProfile(userId, data);
  return withAvatarUrl(data);
}

export async function uploadAvatar(userId, file) {
  if (!file?.buffer?.length) {
    throw ApiError.internal('No avatar image was received.');
  }

  const extensionByType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = extensionByType[file.mimetype];
  if (!extension) throw ApiError.internal('Only JPG, PNG and WebP images are allowed.');
  if (file.buffer.length > 5 * 1024 * 1024) {
    throw ApiError.internal('Avatar image must be 5 MB or smaller.');
  }

  const { data: current, error: currentError } = await supabaseAdmin
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (currentError) throw ApiError.internal(currentError.message);

  const oldPath = current?.avatar_url && !/^https?:\/\//i.test(current.avatar_url)
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

  if (uploadError) throw ApiError.internal(`Avatar upload failed: ${uploadError.message}`);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, avatar_url: newPath }, { onConflict: 'id' })
    .select('*')
    .single();

  if (updateError) {
    await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([newPath]);
    throw ApiError.internal(`Could not save avatar path: ${updateError.message}`);
  }

  if (oldPath && oldPath !== newPath) {
    await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  invalidateCachedProfile(userId);
  setCachedProfile(userId, updated);
  return withAvatarUrl(updated);
}

export async function deleteAccount(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw ApiError.internal(error.message);
  invalidateCachedProfile(userId);
  return true;
}
