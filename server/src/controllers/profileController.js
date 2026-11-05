
import multer from 'multer';
import * as profileService from '../services/profileService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
      const error = new Error(
        'Only JPG, PNG and WebP images are allowed.'
      );
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

// Handles multipart parsing and Multer errors.
export function parseAvatarUpload(req, res, next) {
  avatarUpload.single('avatar')(req, res, (error) => {
    if (error) {
      const status =
        error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

      return res.status(status).json({
        success: false,
        message:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Avatar image must be 5 MB or smaller.'
            : error.message || 'Unable to process avatar image.',
      });
    }

    next();
  });
}

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  return ok(res, profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(
    req.user.id,
    req.body
  );

  return ok(res, profile);
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file?.buffer?.length) {
    return res.status(400).json({
      success: false,
      message: 'Please select an avatar image.',
    });
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Only JPG, PNG and WebP images are allowed.',
    });
  }

  const profile = await profileService.uploadAvatar(
    req.user.id,
    file
  );

  return ok(res, profile);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await profileService.deleteAccount(req.user.id);
  return ok(res, { ok: true });
});
