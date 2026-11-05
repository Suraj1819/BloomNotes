# BloomNotes — API Reference

Base URL: `/api/v1`

All protected routes require `Authorization: Bearer <supabase_access_token>`.
Genuine-activity-tracked routes (mounted with `trackActivity`) extend the 24-hour inactivity session. Background routes (e.g. autosave) do **not**.

Standard response shapes:
- Success: `{ "data": ... }`
- Error:   `{ "error": { "message": "...", "code": "...", "details": ... } }`

## Auth / session

| Method | Path                  | Description |
|--------|-----------------------|-------------|
| POST   | `/auth/activity`      | Genuine activity signal — extends the inactivity session (debounced). |
| GET    | `/auth/session`       | Returns the current user + active application session. |
| POST   | `/auth/logout`        | Revokes the application session (independent of Supabase token). |

## Profile

| Method | Path     | Description |
|--------|----------|-------------|
| GET    | `/profile`     | Get the user's profile (settings + theme prefs). |
| PATCH  | `/profile`     | Update profile fields (validated with Zod). |
| DELETE | `/profile`     | Permanently delete account + cascade. |

## Notes

| Method | Path                          | Description |
|--------|-------------------------------|-------------|
| GET    | `/notes`                      | List notes. Query: `q, folder_id, tag_id, favorite, pinned, archived, deleted, sort, page, limit`. |
| POST   | `/notes`                      | Create note. Backend assigns one of 8 themes — never client-side. |
| GET    | `/notes/:id`                  | Get a single note. |
| PATCH  | `/notes/:id`                  | Update (background autosave — does NOT extend session). |
| DELETE | `/notes/:id`                  | Soft-delete (moves to trash). |
| POST   | `/notes/:id/restore`          | Restore from trash. |
| DELETE | `/notes/:id/permanent`        | Permanently delete. |
| POST   | `/notes/:id/archive`          | Archive. |
| POST   | `/notes/:id/unarchive`        | Unarchive. |
| POST   | `/notes/:id/pin`              | Pin. |
| POST   | `/notes/:id/unpin`            | Unpin. |
| POST   | `/notes/:id/favorite`         | Toggle favorite. |
| POST   | `/notes/:id/duplicate`        | Duplicate. |
| PUT    | `/notes/:id/tags`             | Replace note's tags. Body: `{ tag_ids: [...] }`. |
| POST   | `/notes/:id/opened`           | Touch `last_opened_at` (background). |

## Folders

| Method | Path                | Description |
|--------|---------------------|-------------|
| GET    | `/folders`          | List. |
| POST   | `/folders`          | Create. |
| PATCH  | `/folders/:id`      | Rename / update. |
| DELETE | `/folders/:id`      | Delete (notes keep existing, `folder_id` set to null). |

## Tags

| Method | Path             | Description |
|--------|------------------|-------------|
| GET    | `/tags`          | List. |
| POST   | `/tags`          | Create. |
| PATCH  | `/tags/:id`      | Update. |
| DELETE | `/tags/:id`      | Delete (note_tags rows cascade). |

## Journal

| Method | Path              | Description |
|--------|-------------------|-------------|
| GET    | `/journal`        | List. Query: `q, page, limit`. |
| POST   | `/journal`        | Create. |
| GET    | `/journal/:id`    | Get. |
| PATCH  | `/journal/:id`    | Update. |
| DELETE | `/journal/:id`    | Delete. |

## Personal Space

| Method | Path                                       | Description |
|--------|--------------------------------------------|-------------|
| GET    | `/personal-space`                          | List entries. Query: `q, category_id, page, limit`. |
| POST   | `/personal-space`                          | Create entry (`note | checklist | link | snippet`). |
| PATCH  | `/personal-space/:id`                      | Update. |
| DELETE | `/personal-space/:id`                      | Delete. |
| GET    | `/personal-space/categories`               | List categories. |
| POST   | `/personal-space/categories`               | Create category. |
| DELETE | `/personal-space/categories/:id`           | Delete category (entries keep, `category_id` null). |

## Vault

| Method | Path                     | Description |
|--------|--------------------------|-------------|
| GET    | `/vault`                 | List. Query: `q, category, page, limit`. |
| POST   | `/vault/upload`          | `multipart/form-data` with `file` + optional `category`. |
| GET    | `/vault/:id`             | Get metadata. |
| GET    | `/vault/:id/download`    | Returns a 60-second signed URL. |
| PATCH  | `/vault/:id`             | Update category. |
| DELETE | `/vault/:id`             | Delete file + metadata. |

## Reminders

| Method | Path                | Description |
|--------|---------------------|-------------|
| GET    | `/reminders`        | List. Query: `status, upcoming, overdue, page, limit`. |
| POST   | `/reminders`        | Create. |
| PATCH  | `/reminders/:id`    | Update (e.g. mark `done`). |
| DELETE | `/reminders/:id`    | Delete. |

## Notifications

| Method | Path                            | Description |
|--------|---------------------------------|-------------|
| GET    | `/notifications`                | List. |
| PATCH  | `/notifications/:id/read`       | Mark single as read. |
| POST   | `/notifications/read-all`       | Mark all as read. |

## Settings

| Method | Path         | Description |
|--------|--------------|-------------|
| GET    | `/settings`  | Get settings (subset of profile). |
| PATCH  | `/settings`  | Update settings. |

## Search

| Method | Path         | Description |
|--------|--------------|-------------|
| GET    | `/search?q=` | Global search across notes, folders, tags, journal, personal space, vault metadata. |

## Health

| Method | Path       | Description |
|--------|------------|-------------|
| GET    | `/health`  | Liveness probe. |

## Rate limits

- Global: 300 requests / 15 min / IP.
- Auth-adjacent endpoints may use stricter limits.
- 429 responses include `Retry-After`-style headers.
