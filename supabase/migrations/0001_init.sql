-- ===========================================================================
-- BloomNotes — Initial Schema Migration
-- ===========================================================================
-- Designed to run on a fresh Supabase project.
-- Creates: extensions, enums, tables, indexes, triggers, RLS policies,
-- storage bucket + policies, and a profile-creation trigger for auth.users.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 2. Enums / validated constraints
-- ---------------------------------------------------------------------------
do $$ begin
  create type note_theme_id as enum (
    'sakura_pink',
    'lavender_garden',
    'botanical_garden',
    'midnight_rose',
    'blue_hydrangea',
    'peach_blossom',
    'daisy_minimal',
    'moonlit_garden'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type parent_theme as enum ('light', 'dark', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type journal_mood as enum (
    'joyful', 'happy', 'calm', 'neutral', 'anxious', 'sad', 'angry', 'tired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type reminder_status as enum ('pending', 'done', 'snoozed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum (
    'reminder', 'system', 'account', 'vault'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type personal_space_kind as enum (
    'note', 'checklist', 'link', 'snippet'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_session_state as enum ('active', 'revoked', 'expired');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 3. Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  parent_theme parent_theme not null default 'system',
  floral_intensity smallint not null default 60 check (floral_intensity between 0 and 100),
  reduced_motion boolean not null default false,
  floating_petals boolean not null default true,
  editor_font_size smallint not null default 15 check (editor_font_size between 12 and 22),
  autosave_enabled boolean not null default true,
  default_landing_page text not null default 'dashboard',
  notif_reminders boolean not null default true,
  notif_account boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Folders
-- ---------------------------------------------------------------------------
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  parent_folder_id uuid references public.folders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

drop index if exists idx_folders_user_id;
create index idx_folders_user_id on public.folders(user_id);

drop trigger if exists trg_folders_updated_at on public.folders;
create trigger trg_folders_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Tags
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

drop index if exists idx_tags_user_id;
create index idx_tags_user_id on public.tags(user_id);

drop trigger if exists trg_tags_updated_at on public.tags;
create trigger trg_tags_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Notes
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled note',
  content jsonb not null default '{}'::jsonb,
  excerpt text not null default '',
  folder_id uuid references public.folders(id) on delete set null,
  theme_id note_theme_id not null default 'sakura_pink',
  is_favorite boolean not null default false,
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  word_count integer not null default 0,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists idx_notes_user_id;
create index idx_notes_user_id on public.notes(user_id);

drop index if exists idx_notes_user_deleted;
create index idx_notes_user_deleted on public.notes(user_id, is_deleted);

drop index if exists idx_notes_user_archived;
create index idx_notes_user_archived on public.notes(user_id, is_archived);

drop index if exists idx_notes_user_pinned;
create index idx_notes_user_pinned on public.notes(user_id, is_pinned);

drop index if exists idx_notes_user_favorite;
create index idx_notes_user_favorite on public.notes(user_id, is_favorite);

drop index if exists idx_notes_user_folder;
create index idx_notes_user_folder on public.notes(user_id, folder_id);

drop index if exists idx_notes_user_updated;
create index idx_notes_user_updated on public.notes(user_id, updated_at desc);

drop index if exists idx_notes_title_trgm;
-- trigram search requires pg_trgm; create if available
do $$ begin
  create extension if not exists pg_trgm;
  create index if not exists idx_notes_title_trgm
    on public.notes using gin (title gin_trgm_ops);
exception when others then null; end $$;

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Note-tags (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

drop index if exists idx_note_tags_tag;
create index idx_note_tags_tag on public.note_tags(tag_id);

-- ---------------------------------------------------------------------------
-- 9. Journal entries
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content jsonb not null default '{}'::jsonb,
  mood journal_mood,
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists idx_journal_user_date;
create index idx_journal_user_date on public.journal_entries(user_id, entry_date desc);

drop trigger if exists trg_journal_updated_at on public.journal_entries;
create trigger trg_journal_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. Reminders
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  remind_at timestamptz not null,
  status reminder_status not null default 'pending',
  note_id uuid references public.notes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists idx_reminders_user_at;
create index idx_reminders_user_at on public.reminders(user_id, remind_at);

drop trigger if exists trg_reminders_updated_at on public.reminders;
create trigger trg_reminders_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind notification_kind not null default 'system',
  title text not null,
  body text,
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

drop index if exists idx_notifications_user_created;
create index idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 12. Personal space categories + entries
-- ---------------------------------------------------------------------------
create table if not exists public.personal_space_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.personal_space_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.personal_space_categories(id) on delete set null,
  kind personal_space_kind not null default 'note',
  title text not null default '',
  content text not null default '',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists idx_ps_entries_user;
create index idx_ps_entries_user on public.personal_space_entries(user_id);

drop trigger if exists trg_ps_entries_updated_at on public.personal_space_entries;
create trigger trg_ps_entries_updated_at
  before update on public.personal_space_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 13. Vault entries (file metadata)
-- ---------------------------------------------------------------------------
create table if not exists public.vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists idx_vault_user;
create index idx_vault_user on public.vault_entries(user_id);

drop trigger if exists trg_vault_updated_at on public.vault_entries;
create trigger trg_vault_updated_at
  before update on public.vault_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 14. App sessions (24-hour inactivity tracking)
-- ---------------------------------------------------------------------------
create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state app_session_state not null default 'active',
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

drop index if exists idx_app_sessions_user;
create index idx_app_sessions_user on public.app_sessions(user_id);

drop index if exists idx_app_sessions_state;
create index idx_app_sessions_state on public.app_sessions(state);

-- ---------------------------------------------------------------------------
-- 15. Auth trigger: create profile on user signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 16. Helper: random note theme (server-side trusted assignment)
-- ---------------------------------------------------------------------------
create or replace function public.random_note_theme()
returns note_theme_id
language sql
as $$
  select (array[
    'sakura_pink','lavender_garden','botanical_garden','midnight_rose',
    'blue_hydrangea','peach_blossom','daisy_minimal','moonlit_garden'
  ])[1 + floor(random() * 8)]::note_theme_id;
$$;

-- ===========================================================================
-- 17. Row Level Security
-- ===========================================================================
alter table public.profiles                  enable row level security;
alter table public.folders                   enable row level security;
alter table public.tags                      enable row level security;
alter table public.notes                     enable row level security;
alter table public.note_tags                 enable row level security;
alter table public.journal_entries           enable row level security;
alter table public.reminders                 enable row level security;
alter table public.notifications             enable row level security;
alter table public.personal_space_categories enable row level security;
alter table public.personal_space_entries    enable row level security;
alter table public.vault_entries             enable row level security;
alter table public.app_sessions              enable row level security;

-- Helper: current auth user id
create or replace function public.auth_uid()
returns uuid
language sql
stable
as $$
  select coalesce(auth.uid(), null)::uuid;
$$;

-- 17.1 Profiles — only owner
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = public.auth_uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = public.auth_uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = public.auth_uid()) with check (id = public.auth_uid());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (id = public.auth_uid());

-- 17.2 Generic ownership policy macro (applied per-table)
-- Folders
drop policy if exists "folders_select_own" on public.folders;
create policy "folders_select_own" on public.folders
  for select using (user_id = public.auth_uid());
drop policy if exists "folders_insert_own" on public.folders;
create policy "folders_insert_own" on public.folders
  for insert with check (user_id = public.auth_uid());
drop policy if exists "folders_update_own" on public.folders;
create policy "folders_update_own" on public.folders
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "folders_delete_own" on public.folders;
create policy "folders_delete_own" on public.folders
  for delete using (user_id = public.auth_uid());

-- Tags
drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own" on public.tags
  for select using (user_id = public.auth_uid());
drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own" on public.tags
  for insert with check (user_id = public.auth_uid());
drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own" on public.tags
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own" on public.tags
  for delete using (user_id = public.auth_uid());

-- Notes
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using (user_id = public.auth_uid());
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert with check (user_id = public.auth_uid());
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete using (user_id = public.auth_uid());

-- Note tags — ownership through the note (select) + through note or tag (write)
drop policy if exists "note_tags_select_own" on public.note_tags;
create policy "note_tags_select_own" on public.note_tags
  for select using (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = public.auth_uid())
  );
drop policy if exists "note_tags_insert_own" on public.note_tags;
create policy "note_tags_insert_own" on public.note_tags
  for insert with check (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = public.auth_uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = public.auth_uid())
  );
drop policy if exists "note_tags_delete_own" on public.note_tags;
create policy "note_tags_delete_own" on public.note_tags
  for delete using (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = public.auth_uid())
  );

-- Journal
drop policy if exists "journal_select_own" on public.journal_entries;
create policy "journal_select_own" on public.journal_entries
  for select using (user_id = public.auth_uid());
drop policy if exists "journal_insert_own" on public.journal_entries;
create policy "journal_insert_own" on public.journal_entries
  for insert with check (user_id = public.auth_uid());
drop policy if exists "journal_update_own" on public.journal_entries;
create policy "journal_update_own" on public.journal_entries
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "journal_delete_own" on public.journal_entries;
create policy "journal_delete_own" on public.journal_entries
  for delete using (user_id = public.auth_uid());

-- Reminders
drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own" on public.reminders
  for select using (user_id = public.auth_uid());
drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own" on public.reminders
  for insert with check (user_id = public.auth_uid());
drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own" on public.reminders
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own" on public.reminders
  for delete using (user_id = public.auth_uid());

-- Notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = public.auth_uid());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = public.auth_uid());

-- Personal space categories
drop policy if exists "ps_cat_select_own" on public.personal_space_categories;
create policy "ps_cat_select_own" on public.personal_space_categories
  for select using (user_id = public.auth_uid());
drop policy if exists "ps_cat_insert_own" on public.personal_space_categories;
create policy "ps_cat_insert_own" on public.personal_space_categories
  for insert with check (user_id = public.auth_uid());
drop policy if exists "ps_cat_update_own" on public.personal_space_categories;
create policy "ps_cat_update_own" on public.personal_space_categories
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "ps_cat_delete_own" on public.personal_space_categories;
create policy "ps_cat_delete_own" on public.personal_space_categories
  for delete using (user_id = public.auth_uid());

-- Personal space entries
drop policy if exists "ps_entries_select_own" on public.personal_space_entries;
create policy "ps_entries_select_own" on public.personal_space_entries
  for select using (user_id = public.auth_uid());
drop policy if exists "ps_entries_insert_own" on public.personal_space_entries;
create policy "ps_entries_insert_own" on public.personal_space_entries
  for insert with check (user_id = public.auth_uid());
drop policy if exists "ps_entries_update_own" on public.personal_space_entries;
create policy "ps_entries_update_own" on public.personal_space_entries
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "ps_entries_delete_own" on public.personal_space_entries;
create policy "ps_entries_delete_own" on public.personal_space_entries
  for delete using (user_id = public.auth_uid());

-- Vault entries
drop policy if exists "vault_select_own" on public.vault_entries;
create policy "vault_select_own" on public.vault_entries
  for select using (user_id = public.auth_uid());
drop policy if exists "vault_insert_own" on public.vault_entries;
create policy "vault_insert_own" on public.vault_entries
  for insert with check (user_id = public.auth_uid());
drop policy if exists "vault_update_own" on public.vault_entries;
create policy "vault_update_own" on public.vault_entries
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "vault_delete_own" on public.vault_entries;
create policy "vault_delete_own" on public.vault_entries
  for delete using (user_id = public.auth_uid());

-- App sessions
drop policy if exists "sessions_select_own" on public.app_sessions;
create policy "sessions_select_own" on public.app_sessions
  for select using (user_id = public.auth_uid());
drop policy if exists "sessions_insert_own" on public.app_sessions;
create policy "sessions_insert_own" on public.app_sessions
  for insert with check (user_id = public.auth_uid());
drop policy if exists "sessions_update_own" on public.app_sessions;
create policy "sessions_update_own" on public.app_sessions
  for update using (user_id = public.auth_uid()) with check (user_id = public.auth_uid());
drop policy if exists "sessions_delete_own" on public.app_sessions;
create policy "sessions_delete_own" on public.app_sessions
  for delete using (user_id = public.auth_uid());

-- ===========================================================================
-- 18. Grants (RLS-protected tables — anon/authenticated can attempt, RLS decides)
-- ===========================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to anon;
grant execute on all functions in schema public to authenticated, anon;

-- ===========================================================================
-- 19. Storage bucket + policies
-- ===========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vault',
  'vault',
  false,
  25 * 1024 * 1024,  -- 25 MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: bind every object to its owner by path prefix.
drop policy if exists "vault_storage_insert_own" on storage.objects;
create policy "vault_storage_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vault_storage_select_own" on storage.objects;
create policy "vault_storage_select_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vault_storage_update_own" on storage.objects;
create policy "vault_storage_update_own" on storage.objects
  for update to authenticated using (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vault_storage_delete_own" on storage.objects;
create policy "vault_storage_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- End of migration
-- ===========================================================================
