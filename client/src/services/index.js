
import { api } from '../lib/apiClient.js';

// ---- Helpers --------------------------------------------------------------

function qs(obj = {}) {
  const sp = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          sp.append(key, String(item));
        }
      });
      return;
    }

    sp.append(key, String(value));
  });

  const query = sp.toString();
  return query ? `?${query}` : '';
}

// ---- Notes ----------------------------------------------------------------

export const notesApi = {
  list: (params = {}) => api.get(`/notes${qs(params)}`),
  get: (id) => api.get(`/notes/${id}`),
  create: (body) => api.post('/notes', body),
  update: (id, body) =>
    api.patch(`/notes/${id}`, body, { isBackground: true }),
  remove: (id) => api.del(`/notes/${id}`),
  restore: (id) => api.post(`/notes/${id}/restore`),
  permanentDelete: (id) => api.del(`/notes/${id}/permanent`),
  archive: (id) => api.post(`/notes/${id}/archive`),
  unarchive: (id) => api.post(`/notes/${id}/unarchive`),
  pin: (id) => api.post(`/notes/${id}/pin`),
  unpin: (id) => api.post(`/notes/${id}/unpin`),
  toggleFavorite: (id) => api.post(`/notes/${id}/favorite`),
  duplicate: (id) => api.post(`/notes/${id}/duplicate`),
  setTags: (id, tag_ids) =>
    api.put(`/notes/${id}/tags`, { tag_ids }),
  touchOpened: (id) =>
    api.post(`/notes/${id}/opened`, {}, { isBackground: true }),
};

// ---- Folders --------------------------------------------------------------

export const foldersApi = {
  list: () => api.get('/folders'),
  create: (body) => api.post('/folders', body),
  update: (id, body) => api.patch(`/folders/${id}`, body),
  remove: (id) => api.del(`/folders/${id}`),
};

// ---- Tags -----------------------------------------------------------------

export const tagsApi = {
  list: () => api.get('/tags'),
  create: (body) => api.post('/tags', body),
  update: (id, body) => api.patch(`/tags/${id}`, body),
  remove: (id) => api.del(`/tags/${id}`),
};

// ---- Journal --------------------------------------------------------------

export const journalApi = {
  list: (params = {}) => api.get(`/journal${qs(params)}`),
  get: (id) => api.get(`/journal/${id}`),
  create: (body) => api.post('/journal', body),
  update: (id, body) => api.patch(`/journal/${id}`, body),
  remove: (id) => api.del(`/journal/${id}`),
};

// ---- Personal Space -------------------------------------------------------

export const personalSpaceApi = {
  listCategories: () => api.get('/personal-space/categories'),
  createCategory: (body) =>
    api.post('/personal-space/categories', body),
  deleteCategory: (id) =>
    api.del(`/personal-space/categories/${id}`),
  listEntries: (params = {}) =>
    api.get(`/personal-space${qs(params)}`),
  createEntry: (body) =>
    api.post('/personal-space', body),
  updateEntry: (id, body) =>
    api.patch(`/personal-space/${id}`, body),
  removeEntry: (id) =>
    api.del(`/personal-space/${id}`),
};

// ---- Vault ----------------------------------------------------------------

export const vaultApi = {
  list: (params = {}) => api.get(`/vault${qs(params)}`),
  get: (id) => api.get(`/vault/${id}`),
  download: (id) => api.get(`/vault/${id}/download`),
  update: (id, body) => api.patch(`/vault/${id}`, body),
  remove: (id) => api.del(`/vault/${id}`),
};

// ---- Reminders ------------------------------------------------------------

export const remindersApi = {
  list: (params = {}) => api.get(`/reminders${qs(params)}`),
  create: (body) => api.post('/reminders', body),
  update: (id, body) => api.patch(`/reminders/${id}`, body),
  remove: (id) => api.del(`/reminders/${id}`),
};

// ---- Notifications --------------------------------------------------------

export const notificationsApi = {
  list: (params = {}) => api.get(`/notifications${qs(params)}`),
  markRead: (id) =>
    api.patch(`/notifications/${id}/read`),
  markAllRead: () =>
    api.post('/notifications/read-all'),
};

// ---- Profile / Settings ---------------------------------------------------

export const profileApi = {
  get: () => api.get('/profile'),

  update: (body) => api.patch('/profile', body),

  uploadAvatar: (file) => {
    if (!file) {
      throw new Error('Please select an avatar image.');
    }

    if (!(file instanceof Blob)) {
      throw new Error('Invalid avatar image selected.');
    }

    const formData = new FormData();
    formData.append('avatar', file, file.name || 'avatar');

    return api.post('/profile/avatar', formData);
  },

  remove: () => api.del('/profile'),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (body) => api.patch('/settings', body),
};

// ---- Search ----------------------------------------------------------------

export const searchApi = {
  global: (q) => api.get(`/search${qs({ q })}`),
};
