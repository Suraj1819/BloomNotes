// server/src/services/vaultService.js
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { isAllowedMime, sanitizeFilename, buildStoragePath, assertPathOwnedBy } from '../utils/safeFilename.js';

const BUCKET = 'vault';
const TABLE = 'vault_entries';
const FIELDS = 'id,file_name,mime_type,size_bytes,category,storage_path,created_at,updated_at';

export async function listVault(userId, { q, category, page, limit }) {
  let query = supabaseAdmin.from(TABLE).select(FIELDS, { count: 'exact' }).eq('user_id', userId);
  if (q) query = query.ilike('file_name', `%${q}%`);
  if (category) query = query.eq('category', category);
  query = query.order('created_at', { ascending: false });
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);
  return { items: data || [], total: count || 0, page, limit };
}

export async function uploadVaultFile(userId, file, meta = {}) {
  if (!file) throw ApiError.badRequest('No file provided');
  if (file.size > env.vaultMaxFileSize) throw ApiError.badRequest('File too large');
  if (!isAllowedMime(file.mimetype)) throw ApiError.badRequest('Unsupported file type');

  // Insert metadata row first to get the file id.
  const { data: row, error: rowErr } = await supabaseAdmin.from(TABLE).insert({
    user_id: userId,
    file_name: sanitizeFilename(file.originalname || file.name || 'file'),
    storage_path: 'pending',
    mime_type: file.mimetype,
    size_bytes: file.size,
    category: meta.category || null,
  }).select('*').single();
  if (rowErr) throw ApiError.internal(rowErr.message);

  // Upload to private bucket at <userId>/<fileId>/<filename>.
  const path = buildStoragePath(userId, row.id, row.file_name);
  const buf = file.buffer;
  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET)
    .upload(path, buf, { contentType: row.mime_type, upsert: false });
  if (upErr) {
    // Cleanup metadata row on failure.
    await supabaseAdmin.from(TABLE).delete().eq('id', row.id);
    throw ApiError.internal(upErr.message);
  }

  const { data: updated, error: updErr } = await supabaseAdmin.from(TABLE)
    .update({ storage_path: path }).eq('id', row.id).select(FIELDS).single();
  if (updErr) throw ApiError.internal(updErr.message);
  return updated;
}

export async function getVaultEntry(userId, id) {
  const { data, error } = await supabaseAdmin.from(TABLE).select(FIELDS).eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Vault entry not found');
  return data;
}

export async function getSignedDownloadUrl(userId, id) {
  const entry = await getVaultEntry(userId, id);
  assertPathOwnedBy(entry.storage_path, userId);
  const { data, error } = await supabaseAdmin.storage.from(BUCKET)
    .createSignedUrl(entry.storage_path, 60); // 60 seconds
  if (error) throw ApiError.internal(error.message);
  return { url: data.signedUrl, file_name: entry.file_name, mime_type: entry.mime_type };
}

export async function updateVaultEntry(userId, id, patch) {
  const safe = { category: patch.category };
  const { data, error } = await supabaseAdmin.from(TABLE).update(safe).eq('id', id).eq('user_id', userId).select(FIELDS).maybeSingle();
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Vault entry not found');
  return data;
}

export async function deleteVaultEntry(userId, id) {
  const entry = await getVaultEntry(userId, id);
  assertPathOwnedBy(entry.storage_path, userId);
  const { error: storErr } = await supabaseAdmin.storage.from(BUCKET).remove([entry.storage_path]);
  if (storErr) throw ApiError.internal(storErr.message);
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw ApiError.internal(error.message);
  return true;
}
