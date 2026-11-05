// server/src/controllers/notificationController.js
import * as notificationService from '../services/notificationService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

export const listNotifications = asyncHandler(async (req, res) => {
  return ok(res, await notificationService.listNotifications(req.user.id, {
    page: parseInt(req.query.page || '1', 10),
    limit: parseInt(req.query.limit || '50', 10),
  }));
});
export const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  return ok(res, { ok: true });
});
