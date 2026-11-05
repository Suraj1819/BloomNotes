// server/src/middleware/error.js
import { ApiError } from '../utils/ApiError.js';
import { fail } from '../utils/response.js';
import { logger } from '../utils/logger.js';

// 404 handler — no route matched
export function notFound(req, res, _next) {
  return fail(res, { status: 404, message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });
}

// Zod error → 400
function formatZodError(err) {
  return err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

// Central error handler
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return fail(res, { status: err.statusCode, message: err.message, code: err.code || 'API_ERROR', details: err.details });
  }

  if (err.name === 'ZodError') {
    return fail(res, { status: 400, message: 'Validation error', code: 'VALIDATION', details: formatZodError(err) });
  }

  if (err.type === 'entity.parse.failed') {
    return fail(res, { status: 400, message: 'Invalid JSON body', code: 'BAD_JSON' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return fail(res, { status: 413, message: 'Uploaded file is too large', code: 'FILE_TOO_LARGE' });
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  return fail(res, { status: 500, message: 'Internal server error', code: 'INTERNAL' });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
