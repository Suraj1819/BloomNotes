// server/src/controllers/folderController.js
import * as folderService from '../services/folderService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

export const listFolders = asyncHandler(async (req, res) => {
  return ok(res, await folderService.listFolders(req.user.id));
});
export const createFolder = asyncHandler(async (req, res) => {
  return ok(res, await folderService.createFolder(req.user.id, req.body), 201);
});
export const updateFolder = asyncHandler(async (req, res) => {
  return ok(res, await folderService.updateFolder(req.user.id, req.params.id, req.body));
});
export const deleteFolder = asyncHandler(async (req, res) => {
  await folderService.deleteFolder(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
