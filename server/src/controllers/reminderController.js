// server/src/controllers/reminderController.js
import * as reminderService from '../services/reminderService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

export const listReminders = asyncHandler(async (req, res) => {
  return ok(res, await reminderService.listReminders(req.user.id, {
    status: req.query.status,
    upcoming: req.query.upcoming,
    overdue: req.query.overdue,
    page: parseInt(req.query.page || '1', 10),
    limit: parseInt(req.query.limit || '50', 10),
  }));
});
export const createReminder = asyncHandler(async (req, res) => {
  return ok(res, await reminderService.createReminder(req.user.id, req.body), 201);
});
export const updateReminder = asyncHandler(async (req, res) => {
  return ok(res, await reminderService.updateReminder(req.user.id, req.params.id, req.body));
});
export const deleteReminder = asyncHandler(async (req, res) => {
  await reminderService.deleteReminder(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
