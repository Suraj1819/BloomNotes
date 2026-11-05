// server/src/services/searchService.js
// Server-side global search across user-owned tables.
import { supabaseAdmin } from '../config/supabase.js';

export async function globalSearch(userId, q) {
  if (!q) {
    return { notes: [], folders: [], tags: [], journal: [], personalSpace: [], vault: [] };
  }
  const like = `%${q}%`;

  const [notes, folders, tags, journal, personalSpace, vault] = await Promise.all([
    supabaseAdmin.from('notes').select('id,title,excerpt,theme_id,updated_at').eq('user_id', userId).eq('is_deleted', false).or(`title.ilike.${like},excerpt.ilike.${like}`).order('updated_at', { ascending: false }).limit(20),
    supabaseAdmin.from('folders').select('id,name,color').eq('user_id', userId).ilike('name', like).limit(20),
    supabaseAdmin.from('tags').select('id,name,color').eq('user_id', userId).ilike('name', like).limit(20),
    supabaseAdmin.from('journal_entries').select('id,title,entry_date,mood').eq('user_id', userId).ilike('title', like).limit(20),
    supabaseAdmin.from('personal_space_entries').select('id,title,kind,updated_at').eq('user_id', userId).or(`title.ilike.${like},content.ilike.${like}`).limit(20),
    supabaseAdmin.from('vault_entries').select('id,file_name,mime_type,size_bytes').eq('user_id', userId).ilike('file_name', like).limit(20),
  ]);

  return {
    notes: notes.data || [],
    folders: folders.data || [],
    tags: tags.data || [],
    journal: journal.data || [],
    personalSpace: personalSpace.data || [],
    vault: vault.data || [],
  };
}
