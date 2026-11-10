
// server/src/utils/safeFilename.js
// Secure filename handling and flexible MIME validation.

import path from 'node:path';

/**
 * Sanitize a user-supplied filename to prevent path traversal.
 */
export function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') {
    return 'file';
  }

  const base = path
    .basename(name)
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 100);

  return base || 'file';
}

/**
 * Allow files with any valid MIME type.
 *
 * Examples:
 * application/pdf
 * application/zip
 * application/octet-stream
 * audio/mpeg
 * video/mp4
 * image/png
 * text/plain
 */
export function isAllowedMime(mime) {
  if (!mime || typeof mime !== 'string') {
    return false;
  }

  const normalizedMime = mime
    .split(';')[0]
    .trim()
    .toLowerCase();

  // Accept generic binary files and unknown file formats.
  if (normalizedMime === 'application/octet-stream') {
    return true;
  }

  // Validate MIME type syntax: type/subtype
  const mimePattern =
    /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i;

  return mimePattern.test(normalizedMime);
}

/**
 * Storage path convention:
 * <userId>/<fileId>/<filename>
 */
export function buildStoragePath(userId, fileId, filename) {
  const safeName = sanitizeFilename(filename);

  return `${userId}/${fileId}/${safeName}`;
}

/**
 * Ensure the storage path belongs to the authenticated user.
 */
export function assertPathOwnedBy(storagePath, userId) {
  if (!storagePath || typeof storagePath !== 'string') {
    throw new Error('Invalid storage path');
  }

  const first = storagePath.split('/')[0];

  if (first !== userId) {
    throw new Error('Path traversal detected');
  }
}
