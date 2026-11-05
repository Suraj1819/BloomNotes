
import { supabase } from './supabaseClient.js';

const BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
).replace(/\/+$/, '');

// -----------------------------------------------------------------------------
// API Error
// -----------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

let refreshPromise = null;

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[BloomNotes] Session retrieval failed:', error);
    throw new ApiError('Unable to retrieve login session.', 401);
  }

  let session = data?.session;

  // Refresh expired or missing access token when possible.
  if (!session?.access_token && session?.refresh_token) {
    if (!refreshPromise) {
      refreshPromise = supabase.auth.refreshSession().finally(() => {
        refreshPromise = null;
      });
    }

    const { data: refreshed, error: refreshError } = await refreshPromise;

    if (refreshError) {
      console.error('[BloomNotes] Session refresh failed:', refreshError);
      throw new ApiError(
        'Your session has expired. Please login again.',
        401
      );
    }

    session = refreshed?.session;
  }

  if (!session?.access_token) {
    throw new ApiError(
      'You are not logged in. Please login again.',
      401
    );
  }

  return session.access_token;
}

// -----------------------------------------------------------------------------
// Unauthorized Handling
// -----------------------------------------------------------------------------

async function handleUnauthorized(isBackground = false) {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('[BloomNotes] Sign out failed:', error);
  }

  if (isBackground) {
    return;
  }

  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bn_session_expired', '1');

      if (window.location.pathname !== '/login') {
        window.location.replace('/login?reason=session_expired');
      }
    }
  } catch (error) {
    console.error('[BloomNotes] Login redirect failed:', error);
  }
}

// -----------------------------------------------------------------------------
// Response Parser
// -----------------------------------------------------------------------------

async function parseResponse(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// -----------------------------------------------------------------------------
// Main Request
// -----------------------------------------------------------------------------

async function request(
  path,
  {
    method = 'GET',
    body,
    headers = {},
    signal,
    isBackground = false,
  } = {}
) {
  // Always require a valid Supabase access token.
  const token = await getAccessToken();

  const finalHeaders = new Headers(headers);

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  if (
    body !== undefined &&
    body !== null &&
    !isFormData &&
    !finalHeaders.has('Content-Type')
  ) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  finalHeaders.set('Authorization', `Bearer ${token}`);

  if (isBackground) {
    finalHeaders.set('X-Background', '1');
  }

  const requestUrl = `${BASE}${path}`;

  let response;

  try {
    response = await fetch(requestUrl, {
      method,
      headers: finalHeaders,
      body:
        body === undefined || body === null
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
      signal,
      credentials: 'include',
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    console.error('[BloomNotes] Network request failed:', {
      url: requestUrl,
      method,
      message: error?.message,
    });

    throw new ApiError(
      error?.message || 'Network error. Please check your connection.',
      0
    );
  }

  let payload;

  try {
    payload = await parseResponse(response);
  } catch (error) {
    console.error('[BloomNotes] Response parsing failed:', error);

    throw new ApiError(
      'Unable to read server response.',
      response.status
    );
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      (typeof payload === 'string' ? payload : null) ||
      `Request failed (${response.status})`;

    const apiError = new ApiError(
      message,
      response.status,
      payload
    );

    console.error('[BloomNotes] API request failed:', {
      url: requestUrl,
      method,
      status: response.status,
      message,
      payload,
      isBackground,
    });

    if (response.status === 401) {
      await handleUnauthorized(isBackground);
    }

    throw apiError;
  }

  return payload?.data ?? payload;
}

// -----------------------------------------------------------------------------
// API Methods
// -----------------------------------------------------------------------------

export const api = {
  get: (path, options = {}) =>
    request(path, {
      ...options,
      method: 'GET',
    }),

  post: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'POST',
      body,
    }),

  patch: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'PATCH',
      body,
    }),

  put: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'PUT',
      body,
    }),

  del: (path, options = {}) =>
    request(path, {
      ...options,
      method: 'DELETE',
    }),
};
