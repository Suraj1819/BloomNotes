-- ===========================================================================
-- BloomNotes — Seed data (run only in development)
-- ===========================================================================
-- Run AFTER 0001_init.sql. Creates demo user + sample notes for manual testing.
-- Replace the user_id with a real auth.users.id from your Supabase project.
-- ===========================================================================

-- Example: insert demo notes for an existing user (replace USER_UUID)
-- insert into public.notes (id, user_id, title, content, excerpt, theme_id, is_pinned, is_favorite)
-- values
--   (gen_random_uuid(), '00000000-0000-0000-0000-000000000000'::uuid,
--    'Welcome to BloomNotes',
--    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello world"}]}]}'::jsonb,
--    'Hello world', 'sakura_pink', true, true),
--   (gen_random_uuid(), '00000000-0000-0000-0000-000000000000'::uuid,
--    'Garden planning',
--    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Spring planting"}]}]}'::jsonb,
--    'Spring planting', 'botanical_garden', false, false);

-- This file is intentionally non-destructive. Uncomment and adapt as needed.
