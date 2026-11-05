// server/src/controllers/tagController.js
import * as tagService from '../services/tagService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

export const listTags = asyncHandler(async (req, res) => {
  return ok(res, await tagService.listTags(req.user.id));
});
export const createTag = asyncHandler(async (req, res) => {
  return ok(res, await tagService.createTag(req.user.id, req.body), 201);
});
export const updateTag = asyncHandler(async (req, res) => {
  return ok(res, await tagService.updateTag(req.user.id, req.params.id, req.body));
});
export const deleteTag = asyncHandler(async (req, res) => {
  await tagService.deleteTag(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
