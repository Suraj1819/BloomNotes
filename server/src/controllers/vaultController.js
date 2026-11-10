
import * as vaultService from '../services/vaultService.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';

// --------------------------------------------------
// Multipart parser
// Supports one uploaded file and additional text fields.
// --------------------------------------------------

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return reject(ApiError.badRequest('Expected multipart/form-data'));
    }

    const boundaryMatch = contentType.match(
      /boundary=(?:"([^"]+)"|([^;]+))/i
    );

    if (!boundaryMatch) {
      return reject(ApiError.badRequest('Missing multipart boundary'));
    }

    const boundaryValue = (boundaryMatch[1] || boundaryMatch[2]).trim();
    const boundary = Buffer.from(`--${boundaryValue}`);

    const chunks = [];
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('error', fail);

    req.on('aborted', () => {
      fail(ApiError.badRequest('Upload request was interrupted'));
    });

    req.on('end', () => {
      if (settled) return;

      try {
        const buffer = Buffer.concat(chunks);
        const parts = [];

        let boundaryStart = buffer.indexOf(boundary);

        while (boundaryStart !== -1) {
          let partStart = boundaryStart + boundary.length;

          // Stop when the final boundary is reached.
          if (
            buffer[partStart] === 45 &&
            buffer[partStart + 1] === 45
          ) {
            break;
          }

          // Skip CRLF after boundary.
          if (
            buffer[partStart] === 13 &&
            buffer[partStart + 1] === 10
          ) {
            partStart += 2;
          }

          const nextBoundary = buffer.indexOf(boundary, partStart);

          if (nextBoundary === -1) break;

          let partEnd = nextBoundary;

          // Remove CRLF before the next boundary.
          if (
            buffer[partEnd - 2] === 13 &&
            buffer[partEnd - 1] === 10
          ) {
            partEnd -= 2;
          }

          const partBuffer = buffer.subarray(partStart, partEnd);
          const headerEnd = partBuffer.indexOf(
            Buffer.from('\r\n\r\n')
          );

          if (headerEnd !== -1) {
            const headers = partBuffer
              .subarray(0, headerEnd)
              .toString('utf8');

            const body = partBuffer.subarray(headerEnd + 4);

            const dispositionMatch = headers.match(
              /content-disposition:\s*form-data;([^\r\n]+)/i
            );

            const disposition = dispositionMatch?.[1] || '';

            const nameMatch = disposition.match(/name="([^"]+)"/i);
            const filenameMatch = disposition.match(/filename="([^"]*)"/i);

            const mimeMatch = headers.match(
              /content-type:\s*([^\r\n]+)/i
            );

            parts.push({
              name: nameMatch?.[1] || null,
              filename: filenameMatch?.[1] ?? null,
              mime: mimeMatch?.[1]?.trim() || null,
              body,
            });
          }

          // Continue from the next boundary. This also ensures
          // the final regular part is processed before stopping.
          boundaryStart = nextBoundary;
        }

        settled = true;
        resolve(parts);
      } catch (error) {
        fail(error);
      }
    });
  });
}

// --------------------------------------------------
// LIST VAULT
// --------------------------------------------------

export const listVault = asyncHandler(async (req, res) => {
  const result = await vaultService.listVault(req.user.id, {
    q: req.query.q,
    category: req.query.category,
    page: parseInt(req.query.page || '1', 10),
    limit: parseInt(req.query.limit || '50', 10),
  });

  return ok(res, result);
});

// --------------------------------------------------
// UPLOAD VAULT FILE
// --------------------------------------------------

export const uploadVault = asyncHandler(async (req, res) => {
  const parts = await parseMultipart(req);

  const filePart = parts.find(
    (part) =>
      part.name === 'file' &&
      part.filename !== null &&
      part.filename !== undefined
  );

  if (!filePart || !filePart.filename) {
    throw ApiError.badRequest('No file selected for upload');
  }

  const categoryPart = parts.find(
    (part) => part.name === 'category'
  );

  const descriptionPart = parts.find(
    (part) => part.name === 'description'
  );

  const file = {
    originalname: filePart.filename,
    mimetype: filePart.mime || 'application/octet-stream',
    size: filePart.body.length,
    buffer: filePart.body,
  };

  const metadata = {
    category: categoryPart
      ? categoryPart.body.toString('utf8').trim() || null
      : null,

    description: descriptionPart
      ? descriptionPart.body.toString('utf8').trim() || null
      : null,
  };

  const entry = await vaultService.uploadVaultFile(
    req.user.id,
    file,
    metadata
  );

  return ok(res, entry, 201);
});

// --------------------------------------------------
// GET SINGLE VAULT ENTRY
// --------------------------------------------------

export const getVault = asyncHandler(async (req, res) => {
  const entry = await vaultService.getVaultEntry(
    req.user.id,
    req.params.id
  );

  return ok(res, entry);
});

// --------------------------------------------------
// DOWNLOAD / PREVIEW URL
// --------------------------------------------------

export const downloadVault = asyncHandler(async (req, res) => {
  const result = await vaultService.getSignedDownloadUrl(
    req.user.id,
    req.params.id
  );

  return ok(res, result);
});

// --------------------------------------------------
// UPDATE VAULT METADATA
// Supports category and description updates.
// --------------------------------------------------

export const updateVault = asyncHandler(async (req, res) => {
  const entry = await vaultService.updateVaultEntry(
    req.user.id,
    req.params.id,
    req.body
  );

  return ok(res, entry);
});

// --------------------------------------------------
// DELETE VAULT ENTRY
// --------------------------------------------------

export const deleteVault = asyncHandler(async (req, res) => {
  await vaultService.deleteVaultEntry(
    req.user.id,
    req.params.id
  );

  return ok(res, { ok: true });
});
