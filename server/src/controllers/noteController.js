// server/src/controllers/noteController.js

import * as noteService from '../services/noteService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function parseList(req) {
  return {
    q: req.query.q,
    folderId: req.query.folder_id,
    tagId: req.query.tag_id,
    favorite: req.query.favorite,
    pinned: req.query.pinned,
    archived: req.query.archived,
    deleted: req.query.deleted,
    sort: req.query.sort,
    page: Math.max(1, parseInt(req.query.page || '1', 10) || 1),
    limit: Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || '20', 10) || 20)
    ),
  };
}

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------

export const listNotes = asyncHandler(async (req, res) => {
  const data = await noteService.listNotes(
    req.user.id,
    parseList(req)
  );

  return ok(res, data);
});

export const getNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNote(
    req.user.id,
    req.params.id
  );

  return ok(res, note);
});

export const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(
    req.user.id,
    req.body || {}
  );

  return ok(res, note, 201);
});

// -----------------------------------------------------------------------------
// Update / Autosave
// -----------------------------------------------------------------------------

export const updateNote = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw ApiError.badRequest('Invalid note update payload');
  }

  const note = await noteService.updateNote(
    req.user.id,
    req.params.id,
    req.body
  );

  return ok(res, note);
});

// -----------------------------------------------------------------------------
// Delete / Restore
// -----------------------------------------------------------------------------

export const deleteNote = asyncHandler(async (req, res) => {
  await noteService.softDeleteNote(
    req.user.id,
    req.params.id
  );

  return ok(res, { ok: true });
});

export const restoreNote = asyncHandler(async (req, res) => {
  await noteService.restoreNote(
    req.user.id,
    req.params.id
  );

  return ok(res, { ok: true });
});

export const permanentDelete = asyncHandler(async (req, res) => {
  await noteService.permanentDeleteNote(
    req.user.id,
    req.params.id
  );

  return ok(res, { ok: true });
});

// -----------------------------------------------------------------------------
// Archive
// -----------------------------------------------------------------------------

export const archiveNote = asyncHandler(async (req, res) => {
  await noteService.setFlag(
    req.user.id,
    req.params.id,
    'is_archived',
    true
  );

  return ok(res, { ok: true });
});

export const unarchiveNote = asyncHandler(async (req, res) => {
  await noteService.setFlag(
    req.user.id,
    req.params.id,
    'is_archived',
    false
  );

  return ok(res, { ok: true });
});

// -----------------------------------------------------------------------------
// Pin
// -----------------------------------------------------------------------------

export const pinNote = asyncHandler(async (req, res) => {
  await noteService.setFlag(
    req.user.id,
    req.params.id,
    'is_pinned',
    true
  );

  return ok(res, { ok: true });
});

export const unpinNote = asyncHandler(async (req, res) => {
  await noteService.setFlag(
    req.user.id,
    req.params.id,
    'is_pinned',
    false
  );

  return ok(res, { ok: true });
});

// -----------------------------------------------------------------------------
// Favorite
// -----------------------------------------------------------------------------

export const favoriteNote = asyncHandler(async (req, res) => {
  const value = req.body?.value !== false;

  await noteService.setFlag(
    req.user.id,
    req.params.id,
    'is_favorite',
    value
  );

  return ok(res, {
    ok: true,
    is_favorite: value,
  });
});

export const unfavoriteNote = asyncHandler(async (req, res) => {
  await noteService.setFlag(
    req.user.id,
    req.params.id,
    'is_favorite',
    false
  );

  return ok(res, { ok: true });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const note = await noteService.getNote(
    req.user.id,
    req.params.id
  );

  const value = !note.is_favorite;

  await noteService.setFlag(
    req.user.id,
    req.params.id,
    'is_favorite',
    value
  );

  return ok(res, {
    ok: true,
    is_favorite: value,
  });
});

// -----------------------------------------------------------------------------
// Duplicate
// -----------------------------------------------------------------------------

export const duplicateNote = asyncHandler(async (req, res) => {
  const note = await noteService.duplicateNote(
    req.user.id,
    req.params.id
  );

  return ok(res, note, 201);
});

// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

export const setNoteTags = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body?.tag_ids)) {
    throw ApiError.badRequest('tag_ids must be an array');
  }

  const ids = await noteService.setNoteTags(
    req.user.id,
    req.params.id,
    req.body.tag_ids
  );

  return ok(res, {
    tag_ids: ids,
  });
});

// -----------------------------------------------------------------------------
// Last opened
// -----------------------------------------------------------------------------

export const touchOpened = asyncHandler(async (req, res) => {
  await noteService.touchOpened(
    req.user.id,
    req.params.id
  );

  return ok(res, { ok: true });
});