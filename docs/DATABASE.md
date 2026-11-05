# BloomNotes — Database Schema

PostgreSQL (Supabase). Run `supabase/migrations/0001_init.sql` on a fresh project.

## Enums

| Enum | Values |
|------|--------|
| `note_theme_id` | `sakura_pink, lavender_garden, botanical_garden, midnight_rose, blue_hydrangea, peach_blossom, daisy_minimal, moonlit_garden` |
| `parent_theme` | `light, dark, system` |
| `journal_mood` | `joyful, happy, calm, neutral, anxious, sad, angry, tired` |
| `reminder_status` | `pending, done, snoozed` |
| `notification_kind` | `reminder, system, account, vault` |
| `personal_space_kind` | `note, checklist, link, snippet` |
| `app_session_state` | `active, revoked, expired` |

## Tables

### `profiles`
1:1 with `auth.users`. Created automatically by the `on_auth_user_created` trigger.
- `id` (uuid, PK, FK → `auth.users.id` on delete cascade)
- `full_name`, `email`
- Theme / UI prefs: `parent_theme`, `floral_intensity`, `reduced_motion`, `floating_petals`, `editor_font_size`
- Editor prefs: `autosave_enabled`, `default_landing_page`
- Notification prefs: `notif_reminders`, `notif_account`
- Timestamps: `created_at`, `updated_at` (trigger-maintained)

### `folders`
- `id`, `user_id`, `name`, `color`, `parent_folder_id` (self-ref, set null on delete)
- Unique `(user_id, name)`

### `tags`
- `id`, `user_id`, `name`, `color`
- Unique `(user_id, name)`

### `notes`
- `id`, `user_id`, `title`, `content` (JSONB — Tiptap doc), `excerpt`
- `folder_id` (FK → folders, set null on delete)
- **`theme_id`** (`note_theme_id`, NOT NULL, default random) — assigned once at creation, never updated by the API.
- `is_favorite`, `is_pinned`, `is_archived`, `is_deleted`, `word_count`, `last_opened_at`
- Timestamps.
- Indexes on `(user_id, is_deleted)`, `(user_id, is_archived)`, `(user_id, is_pinned)`, `(user_id, is_favorite)`, `(user_id, folder_id)`, `(user_id, updated_at desc)`, GIN trigram on `title`.

### `note_tags`
- PK `(note_id, tag_id)`. Both FKs cascade.

### `journal_entries`
- `id`, `user_id`, `title`, `content` (JSONB), `mood`, `entry_date`
- Index on `(user_id, entry_date desc)`.

### `reminders`
- `id`, `user_id`, `title`, `description`, `remind_at`, `status`, `note_id` (FK → notes, set null)
- Index on `(user_id, remind_at)`.

### `notifications`
- `id`, `user_id`, `kind`, `title`, `body`, `is_read`, `link`
- Index on `(user_id, created_at desc)`.

### `personal_space_categories`
- `id`, `user_id`, `name`. Unique `(user_id, name)`.

### `personal_space_entries`
- `id`, `user_id`, `category_id` (FK → categories, set null), `kind`, `title`, `content`, `is_pinned`
- Timestamps.

### `vault_entries`
- `id`, `user_id`, `file_name`, `storage_path`, `mime_type`, `size_bytes`, `category`
- Timestamps.
- The actual file lives in the `vault` Storage bucket at `<user_id>/<vault_entry_id>/<file_name>`.

### `app_sessions`
- `id`, `user_id`, `state`, `last_activity_at`, `expires_at`, `created_at`, `revoked_at`
- Indexes on `user_id` and `state`.

## Triggers / functions

- `set_updated_at()` — generic trigger on every table with `updated_at`.
- `handle_new_user()` — `after insert on auth.users` creates a matching `profiles` row. `security definer`.
- `random_note_theme()` — SQL helper that picks one of the 8 themes uniformly at random. Used at note-creation time on the backend.

## RLS

Every user-owned table has RLS enabled with `select/insert/update/delete` policies scoped to `user_id = auth.uid()`. `note_tags` is scoped via existence checks against both `notes` and `tags` ownership.

## Storage

- Bucket `vault` — **private**, 25 MB file size limit, MIME-type allow-list (PDF, Office, TXT, images).
- Storage policies bind every object to its owner: the **first path segment** must equal `auth.uid()`. This is what makes per-user isolation work even with service-role signed URL generation.

## Migration ordering

`0001_init.sql` is idempotent (uses `if not exists` / `drop policy if exists`). To change schema later, add `0002_*.sql`, `0003_*.sql`, etc., following the same pattern.
