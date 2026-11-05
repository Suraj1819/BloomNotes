// server/src/controllers/searchController.js
import { globalSearch } from '../services/searchService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString();
  return ok(res, await globalSearch(req.user.id, q));
});
