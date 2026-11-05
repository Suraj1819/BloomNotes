// server/src/utils/__tests__/safeFilename.test.js
// Run with: node --test server/src/utils/__tests__/safeFilename.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { sanitizeFilename, isAllowedMime, buildStoragePath, assertPathOwnedBy } from '../safeFilename.js';

test('sanitizeFilename strips path traversal', () => {
  // path.basename strips directory components first -> only the final segment survives.
  assert.equal(sanitizeFilename('../../etc/passwd'), 'passwd');
  assert.equal(sanitizeFilename('a/b/c.txt'), 'c.txt');
  assert.equal(sanitizeFilename('ok-file.pdf'), 'ok-file.pdf');
  // Suspicious characters are replaced (dots/dashes/underscores are allowed).
  assert.equal(sanitizeFilename('bad name!@#.pdf'), 'bad_name_.pdf');
});

test('sanitizeFilename falls back to "file" for empty input', () => {
  assert.equal(sanitizeFilename(''), 'file');
  assert.equal(sanitizeFilename(null), 'file');
});

test('isAllowedMime accepts known types', () => {
  assert.ok(isAllowedMime('application/pdf'));
  assert.ok(isAllowedMime('image/png'));
  assert.ok(!isAllowedMime('application/x-msdownload'));
});

test('buildStoragePath uses userId/fileId/filename', () => {
  const p = buildStoragePath('user-123', 'file-456', 'doc.pdf');
  assert.equal(p, 'user-123/file-456/doc.pdf');
});

test('assertPathOwnedBy rejects foreign paths', () => {
  assert.doesNotThrow(() => assertPathOwnedBy('user-123/file-456/doc.pdf', 'user-123'));
  assert.throws(() => assertPathOwnedBy('user-999/file-456/doc.pdf', 'user-123'));
});
