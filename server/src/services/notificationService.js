// server/src/services/notificationService.js
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const TABLE = 'notifications';

export async function listNotifications(userId, { page, limit }) {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabaseAdmin
    .from(TABLE).select('*', { count: 'exact' }).eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw ApiError.internal(error.message);
  return { items: data || [], total: count || 0, page, limit };
}

export async function markRead(userId, id) {
  const { data, error } = await supabaseAdmin.from(TABLE).update({ is_read: true })
    .eq('id', id).eq('user_id', userId).select('id').maybeSingle();
  if (error) throw ApiError.internal(error.message);
  if (!data) throw ApiError.notFound('Notification not found');
  return true;
}

export async function markAllRead(userId) {
  const { error } = await supabaseAdmin.from(TABLE).update({ is_read: true })
    .eq('user_id', userId).eq('is_read', false);
  if (error) throw ApiError.internal(error.message);
  return true;
}
