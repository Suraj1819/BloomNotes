// server/src/validators/index.js
import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  parent_theme: z.enum(['light', 'dark', 'system']).optional(),
  floral_intensity: z.number().int().min(0).max(100).optional(),
  reduced_motion: z.boolean().optional(),
  floating_petals: z.boolean().optional(),
  editor_font_size: z.number().int().min(12).max(22).optional(),
  autosave_enabled: z.boolean().optional(),
  default_landing_page: z.string().max(60).optional(),
  notif_reminders: z.boolean().optional(),
  notif_account: z.boolean().optional(),
});

export const noteCreateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.any().optional(),
  excerpt: z.string().max(500).optional(),
  folder_id: z.string().uuid().nullable().optional(),
  is_favorite: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
});

export const noteUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.any().optional(),
  excerpt: z.string().max(500).optional(),
  folder_id: z.string().uuid().nullable().optional(),
  is_favorite: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
  last_opened_at: z.string().datetime().nullable().optional(),
  // theme_id is intentionally NOT editable here — themes are permanent.
});

export const folderSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(20).optional(),
  parent_folder_id: z.string().uuid().nullable().optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().max(20).optional(),
});

export const journalSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.any().optional(),
  mood: z.enum(['joyful', 'happy', 'calm', 'neutral', 'anxious', 'sad', 'angry', 'tired']).nullable().optional(),
  entry_date: z.string().date().optional(),
});

export const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  remind_at: z.string().datetime(),
  note_id: z.string().uuid().nullable().optional(),
  status: z.enum(['pending', 'done', 'snoozed']).optional(),
});

export const personalSpaceEntrySchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  kind: z.enum(['note', 'checklist', 'link', 'snippet']).optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(20000).optional(),
  is_pinned: z.boolean().optional(),
});

export const personalSpaceCategorySchema = z.object({
  name: z.string().min(1).max(80),
});

export const vaultMetaSchema = z.object({
  category: z.string().max(80).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  sort: z.string().optional(),
});

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const result = schema.safeParse(data);
    if (!result.success) {
      const err = new Error('Validation failed');
      err.name = 'ZodError';
      err.issues = result.error.issues;
      return next(err);
    }
    if (source === 'body') req.body = result.data;
    else if (source === 'query') req.query = result.data;
    else req.params = result.data;
    next();
  };
}
