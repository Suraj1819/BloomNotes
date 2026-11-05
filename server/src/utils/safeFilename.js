// server/src/utils/safeFilename.js
// Sanitize a user-supplied filename to prevent path traversal.
import path from 'node:path';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

export function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'file';
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100);
  return base || 'file';
}

export function isAllowedMime(mime) {
  return ALLOWED_MIME.has(mime);
}

export function buildStoragePath(userId, fileId, filename) {
  // Path convention: <userId>/<fileId>/<filename>
  // The first path segment must equal the authenticated user id (RLS).
  const safeName = sanitizeFilename(filename);
  return `${userId}/${fileId}/${safeName}`;
}

export function assertPathOwnedBy(path, userId) {
  const first = path.split('/')[0];
  if (first !== userId) {
    throw new Error('Path traversal detected');
  }
}
