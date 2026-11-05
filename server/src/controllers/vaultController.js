// server/src/controllers/vaultController.js
import * as vaultService from '../services/vaultService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';

// Lightweight in-memory multipart parser (avoids multer dependency).
// Accepts a single file per upload with fields via application/octet-stream
// + headers, OR multipart/form-data parsed here.
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const ct = req.headers['content-type'] || '';
    if (!ct.startsWith('multipart/form-data')) {
      return reject(ApiError.badRequest('Expected multipart/form-data'));
    }
    const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (!m) return reject(ApiError.badRequest('Missing multipart boundary'));
    const boundary = Buffer.from('--' + (m[1] || m[2]));
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('error', reject);
    req.on('end', () => {
      try {
        const buf = Buffer.concat(chunks);
        const parts = [];
        let start = 0;
        while (true) {
          const bStart = buf.indexOf(boundary, start);
          if (bStart === -1) break;
          const nextStart = buf.indexOf(boundary, bStart + boundary.length);
          if (nextStart === -1) break;
          const partBuf = buf.slice(bStart + boundary.length + 2, nextStart - 2); // strip \r\n
          const headerEnd = partBuf.indexOf('\r\n\r\n');
          if (headerEnd === -1) { start = nextStart; continue; }
          const headers = partBuf.slice(0, headerEnd).toString('utf8');
          const body = partBuf.slice(headerEnd + 4);
          const nameMatch = headers.match(/name="([^"]+)"/);
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          const mimeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
          parts.push({
            name: nameMatch ? nameMatch[1] : null,
            filename: filenameMatch ? filenameMatch[1] : null,
            mime: mimeMatch ? mimeMatch[1].trim() : null,
            body,
          });
          start = nextStart;
        }
        resolve(parts);
      } catch (e) { reject(e); }
    });
  });
}

export const listVault = asyncHandler(async (req, res) => {
  return ok(res, await vaultService.listVault(req.user.id, {
    q: req.query.q,
    category: req.query.category,
    page: parseInt(req.query.page || '1', 10),
    limit: parseInt(req.query.limit || '50', 10),
  }));
});

export const uploadVault = asyncHandler(async (req, res) => {
  const parts = await parseMultipart(req);
  const filePart = parts.find((p) => p.filename);
  if (!filePart) throw ApiError.badRequest('No file part in upload');
  const categoryPart = parts.find((p) => p.name === 'category');
  const file = {
    originalname: filePart.filename,
    mimetype: filePart.mime || 'application/octet-stream',
    size: filePart.body.length,
    buffer: filePart.body,
  };
  const entry = await vaultService.uploadVaultFile(req.user.id, file, {
    category: categoryPart ? categoryPart.body.toString('utf8').trim() : null,
  });
  return ok(res, entry, 201);
});

export const getVault = asyncHandler(async (req, res) => {
  return ok(res, await vaultService.getVaultEntry(req.user.id, req.params.id));
});

export const downloadVault = asyncHandler(async (req, res) => {
  const { url, file_name, mime_type } = await vaultService.getSignedDownloadUrl(req.user.id, req.params.id);
  return ok(res, { url, file_name, mime_type });
});

export const updateVault = asyncHandler(async (req, res) => {
  return ok(res, await vaultService.updateVaultEntry(req.user.id, req.params.id, req.body));
});

export const deleteVault = asyncHandler(async (req, res) => {
  await vaultService.deleteVaultEntry(req.user.id, req.params.id);
  return ok(res, { ok: true });
});
