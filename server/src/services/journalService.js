// server/src/services/journalService.js
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const TABLE = 'journal_entries';
const FIELDS = 'id,title,content,mood,entry_date,created_at,updated_at';

export async function listJournal(userId, { q, page, limit }) {
  let query = supabaseAdmin.from(TABLE).select(FIELDS, { count: 'exact' }).eq('user_id', userId);
  if (q) query = query.or(`title.ilike.%${q}%`);
  query = query.order('entry_date', { ascending: false });
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);
  return { items: data || [], total: count || 0, page, limit };
}

export async function getJournal(userId, id) {
  const { data, error } = await supabaseAdmin.from(TABLE).select(FIELDS).eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Journal entry not found');
  return data;
}

export async function createJournal(userId, payload) {
  const insert = {
    user_id: userId,
    title: payload.title || '',
    content: payload.content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    mood: payload.mood || null,
    entry_date: payload.entry_date || new Date().toISOString().slice(0, 10),
  };
  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(FIELDS).single();
  if (error) throw ApiError.internal(error.message);
  return data;
}

export async function updateJournal(userId, id, patch) {
  const { data, error } = await supabaseAdmin.from(TABLE).update(patch).eq('id', id).eq('user_id', userId).select(FIELDS).maybeSingle();
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Journal entry not found');
  return data;
}

export async function deleteJournal(userId, id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw ApiError.internal(error.message);
  return true;
}
