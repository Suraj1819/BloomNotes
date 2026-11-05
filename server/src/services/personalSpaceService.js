// server/src/services/personalSpaceService.js
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const ENTRIES = 'personal_space_entries';
const CATS = 'personal_space_categories';

export async function listCategories(userId) {
  const { data, error } = await supabaseAdmin.from(CATS).select('*').eq('user_id', userId).order('name');
  if (error) throw ApiError.internal(error.message);
  return data || [];
}
export async function createCategory(userId, payload) {
  const { data, error } = await supabaseAdmin.from(CATS).insert({ user_id: userId, name: payload.name }).select('*').single();
  if (error && error.code === '23505') throw ApiError.conflict('Category already exists');
  if (error) throw ApiError.internal(error.message);
  return data;
}
export async function deleteCategory(userId, id) {
  const { error } = await supabaseAdmin.from(CATS).delete().eq('id', id).eq('user_id', userId);
  if (error) throw ApiError.internal(error.message);
  return true;
}

export async function listEntries(userId, { q, categoryId, page, limit }) {
  let query = supabaseAdmin.from(ENTRIES).select('*', { count: 'exact' }).eq('user_id', userId);
  if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  if (categoryId) query = query.eq('category_id', categoryId);
  query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);
  return { items: data || [], total: count || 0, page, limit };
}
export async function createEntry(userId, payload) {
  const insert = {
    user_id: userId,
    category_id: payload.category_id || null,
    kind: payload.kind || 'note',
    title: payload.title || '',
    content: payload.content || '',
    is_pinned: !!payload.is_pinned,
  };
  const { data, error } = await supabaseAdmin.from(ENTRIES).insert(insert).select('*').single();
  if (error) throw ApiError.internal(error.message);
  return data;
}
export async function updateEntry(userId, id, patch) {
  const { data, error } = await supabaseAdmin.from(ENTRIES).update(patch).eq('id', id).eq('user_id', userId).select('*').maybeSingle();
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Entry not found');
  return data;
}
export async function deleteEntry(userId, id) {
  const { error } = await supabaseAdmin.from(ENTRIES).delete().eq('id', id).eq('user_id', userId);
  if (error) throw ApiError.internal(error.message);
  return true;
}
