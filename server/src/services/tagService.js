// server/src/services/tagService.js
// Tag CRUD with per-user in-memory cache. Tags rarely change, so we cache the
// list for TAG_CACHE_TTL_MS. Mutations invalidate the cache immediately.
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const TABLE = 'tags';
const TAG_CACHE_TTL_MS = 2 * 60_000;
const cache = new Map(); // userId -> { list, expiresAt }

function getCached(userId) {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) { cache.delete(userId); return null; }
  return entry.list;
}
function setCached(userId, list) {
  cache.set(userId, { list, expiresAt: Date.now() + TAG_CACHE_TTL_MS });
}
function invalidate(userId) {
  cache.delete(userId);
}

export async function listTags(userId) {
  const cached = getCached(userId);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from(TABLE).select('id,name,color,created_at,updated_at')
    .eq('user_id', userId).order('name', { ascending: true });
  if (error) throw ApiError.internal(error.message);
  const list = data || [];
  setCached(userId, list);
  return list;
}

export async function createTag(userId, payload) {
  const { data, error } = await supabaseAdmin
    .from(TABLE).insert({ user_id: userId, name: payload.name, color: payload.color || null })
    .select('id,name,color,created_at,updated_at').single();
  if (error && error.code === '23505') throw ApiError.conflict('A tag with this name already exists');
  if (error) throw ApiError.internal(error.message);
  invalidate(userId);
  return data;
}

export async function updateTag(userId, id, patch) {
  const { name, color } = patch;
  const { data, error } = await supabaseAdmin
    .from(TABLE).update({ name, color })
    .eq('id', id).eq('user_id', userId)
    .select('id,name,color,created_at,updated_at').maybeSingle();
  if (error && error.code === '23505') throw ApiError.conflict('A tag with this name already exists');
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Tag not found');
  invalidate(userId);
  return data;
}

export async function deleteTag(userId, id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw ApiError.internal(error.message);
  invalidate(userId);
  return true;
}