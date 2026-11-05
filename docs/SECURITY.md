# BloomNotes — Security Model

## Authentication
- Supabase Auth (email + password, PKCE flow).
- The browser holds the access + refresh tokens via `@supabase/supabase-js`.
- Every API request from the frontend attaches `Authorization: Bearer <access_token>`.
- The backend verifies the token via `supabaseAnon.auth.getUser(token)` — never trusts a client-supplied `user_id`.

## Application session (24-hour inactivity policy)
- Independent of Supabase's own token expiry. Stored in `app_sessions`.
- Genuine user activity (mousemove, click, keydown, touch, scroll, visibility) on the client triggers `POST /auth/activity`. The backend **debounces** updates and only counts genuine signals.
- Background requests (autosave `PATCH /notes/:id`, polling, notification sync) are routed through endpoints that **do not** mount `trackActivity` middleware — they cannot extend the session.
- A periodic `sessionCleanup` job marks sessions older than 24 h of inactivity as `expired`. Any subsequent protected request then 401s.
- `POST /auth/logout` revokes the application session server-side, independent of the (short-lived) Supabase access token.
- **Known limitation:** already-issued Supabase access tokens (≈10 min) cannot be revoked server-side from BloomNotes. RLS still prevents data access after the application session is revoked, so the worst case is a single 10-minute window where a stolen token could read the user's own data — but only their own.

## Authorization
- **Row Level Security** is enabled on every user-owned table.
- Policies compare `user_id = auth.uid()` for select/insert/update/delete.
- The `note_tags` join table is guarded by existence checks against both the note and the tag's owner.
- Service-role access is **only** on the backend (`supabaseAdmin`). The frontend never imports it.
- The frontend uses `supabaseAnon` (anon key) — RLS-protected, safe for the browser.

## Storage
- Bucket `vault` is **private**.
- Storage RLS policies require the **first path segment** of every object to equal `auth.uid()`. This is path-traversal safe: a user cannot read or write another user's path.
- Signed URLs are generated **only** by the backend (`vaultService.getSignedDownloadUrl`) and **only after** ownership verification; they expire in 60 seconds.
- File MIME types are validated against an allow-list. Filenames are sanitized (`sanitizeFilename`).
- `assertPathOwnedBy` defends against any caller trying to forge a path that doesn't start with their user id.

## Input validation
- All mutating endpoints validate body, query and path params with **Zod** schemas (`server/src/validators/index.js`).
- Notes update endpoint refuses to update `theme_id`, `user_id` or `id` — theme is permanent.
- Vault upload size is hard-limited at 25 MB by the bucket config and re-checked at the application layer.

## HTTP hardening
- `helmet` security headers.
- `cors` restricted to `CLIENT_URL` with credentials allowed.
- Global rate limit (300 / 15 min / IP) + auth-route limiter.
- Structured error handler — raw SQL errors and stack traces are never sent to the client.

## Secrets
- The Supabase **service-role key** lives **only** in `server/.env` and is read by `server/src/config/supabase.js`. It is never imported by the client, never exposed via `VITE_*` vars, and never sent to the browser.
- The frontend uses only `VITE_SUPABASE_ANON_KEY` (RLS-protected, safe to publish).

## What's intentionally NOT claimed
- Vault files are **not** end-to-end encrypted. They are protected by RLS, private bucket, and short-lived signed URLs. Do not upload highly sensitive material assuming encryption-at-rest beyond what Supabase provides.
- Notifications are generated server-side by a periodic job, not via websockets. Polling for them does not extend the session.

## Recommended manual security tests
1. Log in as User A; try to GET `/notes/<B's note id>` → expect 404.
2. As User A, try `PATCH /folders/<B's folder id>` → expect 404.
3. As User A, attempt to download User B's vault file → expect 404 (path ownership check).
4. Inspect the client bundle (Vite build) — confirm no `service_role` string is present.
5. Leave the app idle for > 24 h (or set `SESSION_TTL_MS` lower for testing) → confirm the next request returns 401 and the user is redirected to `/login?reason=session_expired`.
