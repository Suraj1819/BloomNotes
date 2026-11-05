// server/src/services/reminderService.js
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const TABLE = 'reminders';
const NOTIF = 'notifications';
const FIELDS = 'id,title,description,remind_at,status,note_id,created_at,updated_at';

export async function listReminders(userId, { status, upcoming, overdue, page, limit }) {
  let query = supabaseAdmin.from(TABLE).select(FIELDS, { count: 'exact' }).eq('user_id', userId);
  if (status) query = query.eq('status', status);
  if (upcoming === 'true' || upcoming === true) {
    query = query.eq('status', 'pending').gte('remind_at', new Date().toISOString());
  }
  if (overdue === 'true' || overdue === true) {
    query = query.eq('status', 'pending').lt('remind_at', new Date().toISOString());
  }
  query = query.order('remind_at', { ascending: true });
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);
  return { items: data || [], total: count || 0, page, limit };
}

export async function createReminder(userId, payload) {
  const insert = {
    user_id: userId,
    title: payload.title,
    description: payload.description || null,
    remind_at: payload.remind_at,
    note_id: payload.note_id || null,
    status: payload.status || 'pending',
  };
  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(FIELDS).single();
  if (error) throw ApiError.internal(error.message);
  return data;
}

export async function updateReminder(userId, id, patch) {
  const { data, error } = await supabaseAdmin.from(TABLE).update(patch).eq('id', id).eq('user_id', userId).select(FIELDS).maybeSingle();
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Reminder not found');
  return data;
}

export async function deleteReminder(userId, id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw ApiError.internal(error.message);
  return true;
}
