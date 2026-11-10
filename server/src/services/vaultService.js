
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

import {
  isAllowedMime,
  sanitizeFilename,
  buildStoragePath,
  assertPathOwnedBy,
} from '../utils/safeFilename.js';

const BUCKET = 'vault';
const TABLE = 'vault_entries';

const FIELDS = [
  'id',
  'file_name',
  'mime_type',
  'size_bytes',
  'category',
  'description',
  'storage_path',
  'created_at',
  'updated_at',
].join(',');

// --------------------------------------------------
// LIST VAULT
// --------------------------------------------------

export async function listVault(
  userId,
  { q, category, page = 1, limit = 50 }
) {
  let query = supabaseAdmin
    .from(TABLE)
    .select(FIELDS, { count: 'exact' })
    .eq('user_id', userId);

  if (q) {
    query = query.ilike('file_name', `%${q}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  query = query.order('created_at', { ascending: false });

  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  return {
    items: data || [],
    total: count || 0,
    page,
    limit,
  };
}

// --------------------------------------------------
// UPLOAD VAULT FILE
// --------------------------------------------------

export async function uploadVaultFile(userId, file, meta = {}) {
  if (!file || !file.buffer) {
    throw ApiError.badRequest('No file provided');
  }

  if (file.size > env.vaultMaxFileSize) {
    throw ApiError.badRequest('File too large');
  }

  if (!isAllowedMime(file.mimetype)) {
    throw ApiError.badRequest('Unsupported file type');
  }

  const fileName = sanitizeFilename(
    file.originalname || file.name || 'file'
  );

  const category = meta.category
    ? String(meta.category).trim().slice(0, 80)
    : null;

  const description = meta.description
    ? String(meta.description).trim().slice(0, 2000)
    : null;

  // Insert metadata row first to get the file ID.
  const { data: row, error: rowErr } = await supabaseAdmin
    .from(TABLE)
    .insert({
      user_id: userId,
      file_name: fileName,
      storage_path: 'pending',
      mime_type: file.mimetype,
      size_bytes: file.size,
      category,
      description,
    })
    .select('*')
    .single();

  if (rowErr) {
    throw ApiError.internal(rowErr.message);
  }

  // Upload to private bucket:
  // <userId>/<fileId>/<filename>
  const path = buildStoragePath(userId, row.id, row.file_name);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: row.mime_type,
      upsert: false,
    });

  if (uploadError) {
    // Clean up metadata if storage upload fails.
    await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', row.id)
      .eq('user_id', userId);

    throw ApiError.internal(uploadError.message);
  }

  // Save the final storage path.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from(TABLE)
    .update({
      storage_path: path,
    })
    .eq('id', row.id)
    .eq('user_id', userId)
    .select(FIELDS)
    .single();

  if (updateError) {
    // Attempt cleanup if metadata finalization fails.
    await supabaseAdmin.storage
      .from(BUCKET)
      .remove([path]);

    await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', row.id)
      .eq('user_id', userId);

    throw ApiError.internal(updateError.message);
  }

  return updated;
}

// --------------------------------------------------
// GET SINGLE VAULT ENTRY
// --------------------------------------------------

export async function getVaultEntry(userId, id) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(FIELDS)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(error.message);
  }

  if (!data) {
    throw ApiError.notFound('Vault entry not found');
  }

  return data;
}

// --------------------------------------------------
// DOWNLOAD / PREVIEW URL
// --------------------------------------------------

export async function getSignedDownloadUrl(userId, id) {
  const entry = await getVaultEntry(userId, id);

  if (!entry.storage_path || entry.storage_path === 'pending') {
    throw ApiError.badRequest('File is not ready for download');
  }

  assertPathOwnedBy(entry.storage_path, userId);

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(entry.storage_path, 60);

  if (error) {
    throw ApiError.internal(error.message);
  }

  return {
    url: data.signedUrl,
    file_name: entry.file_name,
    mime_type: entry.mime_type,
  };
}

// --------------------------------------------------
// UPDATE VAULT METADATA
// Supports partial category and description updates.
// --------------------------------------------------

export async function updateVaultEntry(userId, id, patch = {}) {
  const safe = {};

  if (Object.prototype.hasOwnProperty.call(patch, 'category')) {
    safe.category =
      patch.category === null
        ? null
        : String(patch.category).trim().slice(0, 80);
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'description')) {
    safe.description =
      patch.description === null
        ? null
        : String(patch.description).trim().slice(0, 2000);
  }

  if (Object.keys(safe).length === 0) {
    throw ApiError.badRequest('No valid fields provided for update');
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(safe)
    .eq('id', id)
    .eq('user_id', userId)
    .select(FIELDS)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(error.message);
  }

  if (!data) {
    throw ApiError.notFound('Vault entry not found');
  }

  return data;
}

// --------------------------------------------------
// DELETE VAULT ENTRY
// --------------------------------------------------

export async function deleteVaultEntry(userId, id) {
  const entry = await getVaultEntry(userId, id);

  if (!entry.storage_path || entry.storage_path === 'pending') {
    throw ApiError.badRequest('File storage is not ready');
  }

  assertPathOwnedBy(entry.storage_path, userId);

  const { error: storageError } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([entry.storage_path]);

  if (storageError) {
    throw ApiError.internal(storageError.message);
  }

  const { error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw ApiError.internal(error.message);
  }

  return true;
}
