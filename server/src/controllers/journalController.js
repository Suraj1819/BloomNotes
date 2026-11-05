// server/src/controllers/journalController.js
import * as journalService from '../services/journalService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

function parsePaging(req) {
  return {
    q: req.query.q,
    page: parseInt(req.query.page || '1', 10),
    limit: parseInt(req.query.limit || '20', 10),
  };
}

export const listJournal = asyncHandler(async (req, res) => {
  return ok(res, await journalService.listJournal(req.user.id, parsePaging(req)));
});
export const getJournal = asyncHandler(async (req, res) => {
  return ok(res, await journalService.getJournal(req.user.id, req.params.id));
});
export const createJournal = asyncHandler(async (req, res) => {
  return ok(res, await journalService.createJournal(req.user.id, req.body), 201);
});
export const updateJournal = asyncHandler(async (req, res) => {
  return ok(res, await journalService.updateJournal(req.user.id, req.params.id, req.body));
});
export const deleteJournal = asyncHandler(async (req, res) => {
  await journalService.deleteJournal(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
