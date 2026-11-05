// server/src/controllers/personalSpaceController.js
import * as ps from '../services/personalSpaceService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

export const listCategories = asyncHandler(async (req, res) => {
  return ok(res, await ps.listCategories(req.user.id));
});
export const createCategory = asyncHandler(async (req, res) => {
  return ok(res, await ps.createCategory(req.user.id, req.body), 201);
});
export const deleteCategory = asyncHandler(async (req, res) => {
  await ps.deleteCategory(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
export const listEntries = asyncHandler(async (req, res) => {
  return ok(res, await ps.listEntries(req.user.id, {
    q: req.query.q,
    categoryId: req.query.category_id,
    page: parseInt(req.query.page || '1', 10),
    limit: parseInt(req.query.limit || '50', 10),
  }));
});
export const createEntry = asyncHandler(async (req, res) => {
  return ok(res, await ps.createEntry(req.user.id, req.body), 201);
});
export const updateEntry = asyncHandler(async (req, res) => {
  return ok(res, await ps.updateEntry(req.user.id, req.params.id, req.body));
});
export const deleteEntry = asyncHandler(async (req, res) => {
  await ps.deleteEntry(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
