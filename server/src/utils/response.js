// server/src/utils/response.js
// Standard success response shape: { data }
export function ok(res, data, status = 200) {
  return res.status(status).json({ data });
}

export function noContent(res) {
  return res.status(204).end();
}

// Standard error response shape: { error: { message, code, details? } }
export function fail(res, { status = 500, message = 'Internal server error', code = 'INTERNAL', details = null }) {
  return res.status(status).json({ error: { message, code, details } });
}
