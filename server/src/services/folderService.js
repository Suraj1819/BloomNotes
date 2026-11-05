// server/src/services/folderService.js
// Folder CRUD with per-user in-memory cache. Folders rarely change, so we
// cache the list for FOLDER_CACHE_TTL_MS to skip the per-request DB round-trip.
// Mutations invalidate the cache immediately.
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const TABLE = 'folders';
const FOLDER_CACHE_TTL_MS = 2 * 60_000; // 2 minutes
const cache = new Map(); // userId -> { list, expiresAt }

function getCached(userId) {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) { cache.delete(userId); return null; }
  return entry.list;
}
function setCached(userId, list) {
  cache.set(userId, { list, expiresAt: Date.now() + FOLDER_CACHE_TTL_MS });
}
function invalidate(userId) {
  cache.delete(userId);
}

export async function listFolders(userId) {
  const cached = getCached(userId);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from(TABLE).select('id,name,color,parent_folder_id,created_at,updated_at')
    .eq('user_id', userId).order('name', { ascending: true });
  if (error) throw ApiError.internal(error.message);
  const list = data || [];
  setCached(userId, list);
  return list;
}

export async function createFolder(userId, payload) {
  const { data, error } = await supabaseAdmin
    .from(TABLE).insert({ user_id: userId, name: payload.name, color: payload.color || null, parent_folder_id: payload.parent_folder_id || null })
    .select('id,name,color,parent_folder_id,created_at,updated_at').single();
  if (error && error.code === '23505') throw ApiError.conflict('A folder with this name already exists');
  if (error) throw ApiError.internal(error.message);
  invalidate(userId);
  return data;
}

export async function updateFolder(userId, id, patch) {
  const { name, color, parent_folder_id } = patch;
  const { data, error } = await supabaseAdmin
    .from(TABLE).update({ name, color, parent_folder_id })
    .eq('id', id).eq('user_id', userId)
    .select('id,name,color,parent_folder_id,created_at,updated_at').maybeSingle();
  if (error && error.code === '23505') throw ApiError.conflict('A folder with this name already exists');
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Folder not found');
  invalidate(userId);
  return data;
}

export async function deleteFolder(userId, id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw ApiError.internal(error.message);
  invalidate(userId);
  return true;
}