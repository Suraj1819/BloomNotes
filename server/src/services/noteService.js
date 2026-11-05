// server/src/services/noteService.js

import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const TABLE = 'notes';
const NOTE_TAGS = 'note_tags';
const TAGS = 'tags';

const NOTE_FIELDS = [
  'id',
  'user_id',
  'title',
  'excerpt',
  'content',
  'folder_id',
  'theme_id',
  'is_favorite',
  'is_pinned',
  'is_archived',
  'is_deleted',
  'word_count',
  'last_opened_at',
  'created_at',
  'updated_at',
].join(',');

const FLORAL_THEMES = [
  'sakura_pink',
  'lavender_garden',
  'botanical_garden',
  'midnight_rose',
  'blue_hydrangea',
  'peach_blossom',
  'daisy_minimal',
  'moonlit_garden',
];

// Only these fields can be changed through the normal note update API.
const ALLOWED_UPDATE_FIELDS = new Set([
  'title',
  'content',
  'excerpt',
  'folder_id',
  'is_favorite',
  'is_pinned',
  'is_archived',
  'is_deleted',
  'word_count',
  'last_opened_at',
]);

const DEFAULT_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function throwDatabaseError(error) {
  if (!error) return;

  console.error('[BloomNotes] Supabase notes error:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  throw ApiError.internal(
    error.message || 'Database operation failed'
  );
}

function sanitizeNotePatch(patch = {}) {
  if (
    !patch ||
    typeof patch !== 'object' ||
    Array.isArray(patch)
  ) {
    throw ApiError.badRequest('Invalid note update payload');
  }

  const safe = {};

  for (const [key, value] of Object.entries(patch)) {
    if (!ALLOWED_UPDATE_FIELDS.has(key)) {
      continue;
    }

    safe[key] = value;
  }

  if ('title' in safe) {
    if (typeof safe.title !== 'string') {
      throw ApiError.badRequest('Note title must be a string');
    }

    safe.title = safe.title.trim() || 'Untitled note';
  }

  if ('excerpt' in safe && typeof safe.excerpt !== 'string') {
    throw ApiError.badRequest('Note excerpt must be a string');
  }

  if ('content' in safe) {
    if (
      safe.content === null ||
      typeof safe.content !== 'object' ||
      Array.isArray(safe.content)
    ) {
      throw ApiError.badRequest('Note content must be a JSON object');
    }
  }

  if ('folder_id' in safe && safe.folder_id === '') {
    safe.folder_id = null;
  }

  if ('word_count' in safe) {
    const count = Number(safe.word_count);

    if (!Number.isInteger(count) || count < 0) {
      throw ApiError.badRequest('Invalid word count');
    }

    safe.word_count = count;
  }

  return safe;
}

// -----------------------------------------------------------------------------
// List
// -----------------------------------------------------------------------------

export async function listNotes(
  userId,
  {
    q,
    folderId,
    tagId,
    favorite,
    pinned,
    archived,
    deleted,
    sort,
    limit = 20,
    page = 1,
  } = {}
) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  let query = supabaseAdmin
    .from(TABLE)
    .select(NOTE_FIELDS, { count: 'exact' })
    .eq('user_id', userId);

  if (deleted === true || deleted === 'true') {
    query = query.eq('is_deleted', true);
  } else {
    query = query.eq('is_deleted', false);

    if (archived === true || archived === 'true') {
      query = query.eq('is_archived', true);
    } else {
      query = query.eq('is_archived', false);
    }
  }

  if (favorite === true || favorite === 'true') {
    query = query.eq('is_favorite', true);
  }

  if (pinned === true || pinned === 'true') {
    query = query.eq('is_pinned', true);
  }

  if (folderId) {
    query = query.eq('folder_id', folderId);
  }

  if (q) {
    const search = String(q).replace(/[%_,()]/g, ' ').trim();

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,excerpt.ilike.%${search}%`
      );
    }
  }

  if (tagId) {
    const { data: links, error: linkError } = await supabaseAdmin
      .from(NOTE_TAGS)
      .select('note_id')
      .eq('tag_id', tagId);

    if (linkError) {
      throwDatabaseError(linkError);
    }

    const noteIds = (links || []).map((link) => link.note_id);

    query = query.in(
      'id',
      noteIds.length
        ? noteIds
        : ['00000000-0000-0000-0000-000000000000']
    );
  }

  const sortField =
    sort === 'created'
      ? 'created_at'
      : sort === 'title'
        ? 'title'
        : 'updated_at';

  query = query.order(sortField, {
    ascending: sort === 'title',
  });

  const offset = (safePage - 1) * safeLimit;

  query = query.range(
    offset,
    offset + safeLimit - 1
  );

  const {
    data,
    error,
    count,
  } = await query;

  if (error) {
    throwDatabaseError(error);
  }

  let notes = data || [];

  // Attach tags to notes.
  if (notes.length > 0) {
    const noteIds = notes.map((note) => note.id);

    const {
      data: tagLinks,
      error: tagLinksError,
    } = await supabaseAdmin
      .from(NOTE_TAGS)
      .select('note_id,tag_id')
      .in('note_id', noteIds);

    if (tagLinksError) {
      throwDatabaseError(tagLinksError);
    }

    const tagIds = [
      ...new Set(
        (tagLinks || []).map((link) => link.tag_id)
      ),
    ];

    const tagsById = {};

    if (tagIds.length > 0) {
      const {
        data: tagRows,
        error: tagRowsError,
      } = await supabaseAdmin
        .from(TAGS)
        .select('*')
        .in('id', tagIds);

      if (tagRowsError) {
        throwDatabaseError(tagRowsError);
      }

      (tagRows || []).forEach((tag) => {
        tagsById[tag.id] = tag;
      });
    }

    const tagsByNote = {};

    (tagLinks || []).forEach((link) => {
      if (!tagsByNote[link.note_id]) {
        tagsByNote[link.note_id] = [];
      }

      const tag = tagsById[link.tag_id];

      if (tag) {
        tagsByNote[link.note_id].push(tag);
      }
    });

    notes = notes.map((note) => ({
      ...note,
      tags: tagsByNote[note.id] || [],
    }));
  } else {
    notes = [];
  }

  return {
    items: notes,
    total: count || 0,
    page: safePage,
    limit: safeLimit,
  };
}

// -----------------------------------------------------------------------------
// Get
// -----------------------------------------------------------------------------

export async function getNote(userId, id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .select(NOTE_FIELDS)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw ApiError.notFound('Note not found');
  }

  return data;
}

// -----------------------------------------------------------------------------
// Create
// -----------------------------------------------------------------------------

export async function createNote(userId, payload = {}) {
  const theme_id =
    FLORAL_THEMES[
      Math.floor(Math.random() * FLORAL_THEMES.length)
    ];

  const title =
    typeof payload.title === 'string' && payload.title.trim()
      ? payload.title.trim()
      : 'Untitled note';

  const insert = {
    user_id: userId,
    title,
    content: payload.content ?? DEFAULT_CONTENT,
    excerpt: payload.excerpt || '',
    folder_id: payload.folder_id || null,
    theme_id,
    is_favorite: Boolean(payload.is_favorite),
    is_pinned: Boolean(payload.is_pinned),
  };

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .insert(insert)
    .select(NOTE_FIELDS)
    .single();

  if (error) {
    throwDatabaseError(error);
  }

  return {
    ...data,
    tags: [],
  };
}

// -----------------------------------------------------------------------------
// Update / Autosave
// -----------------------------------------------------------------------------

export async function updateNote(userId, id, patch = {}) {
  const safePatch = sanitizeNotePatch(patch);

  if (Object.keys(safePatch).length === 0) {
    return getNote(userId, id);
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .update(safePatch)
    .eq('id', id)
    .eq('user_id', userId)
    .select(NOTE_FIELDS)
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw ApiError.notFound('Note not found');
  }

  return data;
}

// -----------------------------------------------------------------------------
// Soft Delete
// -----------------------------------------------------------------------------

export async function softDeleteNote(userId, id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .update({
      is_deleted: true,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw ApiError.notFound('Note not found');
  }

  return true;
}

// -----------------------------------------------------------------------------
// Restore
// -----------------------------------------------------------------------------

export async function restoreNote(userId, id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .update({
      is_deleted: false,
      is_archived: false,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw ApiError.notFound('Note not found');
  }

  return true;
}

// -----------------------------------------------------------------------------
// Permanent Delete
// -----------------------------------------------------------------------------

export async function permanentDeleteNote(userId, id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    throwDatabaseError(error);
  }

  if (!data || data.length === 0) {
    throw ApiError.notFound('Note not found');
  }

  return true;
}

// -----------------------------------------------------------------------------
// Flags
// -----------------------------------------------------------------------------

export async function setFlag(userId, id, field, value) {
  const allowedFields = [
    'is_favorite',
    'is_pinned',
    'is_archived',
  ];

  if (!allowedFields.includes(field)) {
    throw ApiError.badRequest('Invalid note flag');
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .update({
      [field]: Boolean(value),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw ApiError.notFound('Note not found');
  }

  return true;
}

// -----------------------------------------------------------------------------
// Duplicate
// -----------------------------------------------------------------------------

export async function duplicateNote(userId, id) {
  const source = await getNote(userId, id);

  return createNote(userId, {
    title: `${source.title} (copy)`,
    content: source.content,
    excerpt: source.excerpt,
    folder_id: source.folder_id,
    is_favorite: false,
    is_pinned: false,
  });
}

// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

export async function setNoteTags(userId, noteId, tagIds = []) {
  await getNote(userId, noteId);

  if (!Array.isArray(tagIds)) {
    throw ApiError.badRequest('tag_ids must be an array');
  }

  const uniqueTagIds = [
    ...new Set(tagIds.filter((id) => typeof id === 'string' && id)),
  ];

  // Verify that all tags belong to the current user.
  let validIds = [];

  if (uniqueTagIds.length > 0) {
    const {
      data: tagRows,
      error: tagError,
    } = await supabaseAdmin
      .from(TAGS)
      .select('id')
      .in('id', uniqueTagIds)
      .eq('user_id', userId);

    if (tagError) {
      throwDatabaseError(tagError);
    }

    validIds = (tagRows || []).map((tag) => tag.id);

    if (validIds.length !== uniqueTagIds.length) {
      throw ApiError.badRequest('One or more tags are invalid');
    }
  }

  // Remove previous links.
  const {
    error: deleteError,
  } = await supabaseAdmin
    .from(NOTE_TAGS)
    .delete()
    .eq('note_id', noteId);

  if (deleteError) {
    throwDatabaseError(deleteError);
  }

  // Insert new links.
  if (validIds.length > 0) {
    const inserts = validIds.map((tagId) => ({
      note_id: noteId,
      tag_id: tagId,
    }));

    const {
      error: insertError,
    } = await supabaseAdmin
      .from(NOTE_TAGS)
      .insert(inserts);

    if (insertError) {
      throwDatabaseError(insertError);
    }
  }

  return validIds;
}

// -----------------------------------------------------------------------------
// Last Opened
// -----------------------------------------------------------------------------

export async function touchOpened(userId, id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from(TABLE)
    .update({
      last_opened_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw ApiError.notFound('Note not found');
  }

  return true;
}