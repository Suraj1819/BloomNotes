
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { trackActivity } from '../middleware/activity.js';

import {
  postActivity,
  getSession,
  postLogout,
} from '../controllers/authController.js';

import * as profile from '../controllers/profileController.js';
import * as notes from '../controllers/noteController.js';
import * as folders from '../controllers/folderController.js';
import * as tags from '../controllers/tagController.js';
import * as journal from '../controllers/journalController.js';
import * as ps from '../controllers/personalSpaceController.js';
import * as vault from '../controllers/vaultController.js';
import * as reminders from '../controllers/reminderController.js';
import * as notif from '../controllers/notificationController.js';
import * as settings from '../controllers/settingsController.js';
import * as search from '../controllers/searchController.js';

import {
  validate,
  noteCreateSchema,
  noteUpdateSchema,
  folderSchema,
  tagSchema,
  journalSchema,
  reminderSchema,
  reminderUpdateSchema,
  personalSpaceEntrySchema,
  personalSpaceCategorySchema,
  profileSchema,
  vaultMetaSchema,
} from '../validators/index.js';

const router = Router();

// --------------------------------------------------
// AUTH / SESSION
// --------------------------------------------------

router.post(
  '/auth/activity',
  requireAuth,
  trackActivity,
  postActivity
);

router.get(
  '/auth/session',
  requireAuth,
  getSession
);

router.post(
  '/auth/logout',
  requireAuth,
  postLogout
);

// --------------------------------------------------
// PROFILE
// --------------------------------------------------

router.get(
  '/profile',
  requireAuth,
  trackActivity,
  profile.getProfile
);

router.patch(
  '/profile',
  requireAuth,
  trackActivity,
  validate(profileSchema),
  profile.updateProfile
);

router.post(
  '/profile/avatar',
  requireAuth,
  trackActivity,
  profile.parseAvatarUpload,
  profile.uploadAvatar
);

router.delete(
  '/profile',
  requireAuth,
  trackActivity,
  profile.deleteAccount
);

// --------------------------------------------------
// NOTES
// --------------------------------------------------

router.get(
  '/notes',
  requireAuth,
  trackActivity,
  notes.listNotes
);

router.post(
  '/notes',
  requireAuth,
  trackActivity,
  validate(noteCreateSchema),
  notes.createNote
);

router.get(
  '/notes/:id',
  requireAuth,
  notes.getNote
);

router.post(
  '/notes/:id/opened',
  requireAuth,
  notes.touchOpened
);

router.patch(
  '/notes/:id',
  requireAuth,
  validate(noteUpdateSchema),
  notes.updateNote
);

router.delete(
  '/notes/:id',
  requireAuth,
  notes.deleteNote
);

router.post(
  '/notes/:id/restore',
  requireAuth,
  trackActivity,
  notes.restoreNote
);

router.delete(
  '/notes/:id/permanent',
  requireAuth,
  trackActivity,
  notes.permanentDelete
);

router.post(
  '/notes/:id/archive',
  requireAuth,
  trackActivity,
  notes.archiveNote
);

router.post(
  '/notes/:id/unarchive',
  requireAuth,
  trackActivity,
  notes.unarchiveNote
);

router.post(
  '/notes/:id/pin',
  requireAuth,
  trackActivity,
  notes.pinNote
);

router.post(
  '/notes/:id/unpin',
  requireAuth,
  trackActivity,
  notes.unpinNote
);

router.post(
  '/notes/:id/favorite',
  requireAuth,
  trackActivity,
  notes.toggleFavorite
);

router.post(
  '/notes/:id/duplicate',
  requireAuth,
  trackActivity,
  notes.duplicateNote
);

router.put(
  '/notes/:id/tags',
  requireAuth,
  trackActivity,
  notes.setNoteTags
);

// --------------------------------------------------
// FOLDERS
// --------------------------------------------------

router.get(
  '/folders',
  requireAuth,
  trackActivity,
  folders.listFolders
);

router.post(
  '/folders',
  requireAuth,
  trackActivity,
  validate(folderSchema),
  folders.createFolder
);

router.patch(
  '/folders/:id',
  requireAuth,
  trackActivity,
  validate(folderSchema),
  folders.updateFolder
);

router.delete(
  '/folders/:id',
  requireAuth,
  trackActivity,
  folders.deleteFolder
);

// --------------------------------------------------
// TAGS
// --------------------------------------------------

router.get(
  '/tags',
  requireAuth,
  trackActivity,
  tags.listTags
);

router.post(
  '/tags',
  requireAuth,
  trackActivity,
  validate(tagSchema),
  tags.createTag
);

router.patch(
  '/tags/:id',
  requireAuth,
  trackActivity,
  validate(tagSchema),
  tags.updateTag
);

router.delete(
  '/tags/:id',
  requireAuth,
  trackActivity,
  tags.deleteTag
);

// --------------------------------------------------
// JOURNAL
// --------------------------------------------------

router.get(
  '/journal',
  requireAuth,
  trackActivity,
  journal.listJournal
);

router.post(
  '/journal',
  requireAuth,
  trackActivity,
  validate(journalSchema),
  journal.createJournal
);

router.get(
  '/journal/:id',
  requireAuth,
  journal.getJournal
);

router.patch(
  '/journal/:id',
  requireAuth,
  trackActivity,
  validate(journalSchema),
  journal.updateJournal
);

router.delete(
  '/journal/:id',
  requireAuth,
  trackActivity,
  journal.deleteJournal
);

// --------------------------------------------------
// PERSONAL SPACE
// --------------------------------------------------

router.get(
  '/personal-space',
  requireAuth,
  trackActivity,
  ps.listEntries
);

router.post(
  '/personal-space',
  requireAuth,
  trackActivity,
  validate(personalSpaceEntrySchema),
  ps.createEntry
);

router.patch(
  '/personal-space/:id',
  requireAuth,
  trackActivity,
  validate(personalSpaceEntrySchema),
  ps.updateEntry
);

router.delete(
  '/personal-space/:id',
  requireAuth,
  trackActivity,
  ps.deleteEntry
);

router.get(
  '/personal-space/categories',
  requireAuth,
  trackActivity,
  ps.listCategories
);

router.post(
  '/personal-space/categories',
  requireAuth,
  trackActivity,
  validate(personalSpaceCategorySchema),
  ps.createCategory
);

router.delete(
  '/personal-space/categories/:id',
  requireAuth,
  trackActivity,
  ps.deleteCategory
);

// --------------------------------------------------
// VAULT
// --------------------------------------------------

router.get(
  '/vault',
  requireAuth,
  trackActivity,
  vault.listVault
);

router.post(
  '/vault/upload',
  requireAuth,
  trackActivity,
  vault.uploadVault
);

router.get(
  '/vault/:id',
  requireAuth,
  vault.getVault
);

router.get(
  '/vault/:id/download',
  requireAuth,
  vault.downloadVault
);

// Update document category and description.
router.patch(
  '/vault/:id',
  requireAuth,
  trackActivity,
  validate(vaultMetaSchema),
  vault.updateVault
);

router.delete(
  '/vault/:id',
  requireAuth,
  trackActivity,
  vault.deleteVault
);

// --------------------------------------------------
// REMINDERS
// --------------------------------------------------

router.get(
  '/reminders',
  requireAuth,
  trackActivity,
  reminders.listReminders
);

router.post(
  '/reminders',
  requireAuth,
  trackActivity,
  validate(reminderSchema),
  reminders.createReminder
);

router.patch(
  '/reminders/:id',
  requireAuth,
  trackActivity,
  validate(reminderUpdateSchema),
  reminders.updateReminder
);

router.delete(
  '/reminders/:id',
  requireAuth,
  trackActivity,
  reminders.deleteReminder
);

// --------------------------------------------------
// NOTIFICATIONS
// --------------------------------------------------

router.get(
  '/notifications',
  requireAuth,
  notif.listNotifications
);

router.patch(
  '/notifications/:id/read',
  requireAuth,
  trackActivity,
  notif.markRead
);

router.post(
  '/notifications/read-all',
  requireAuth,
  trackActivity,
  notif.markAllRead
);

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------

router.get(
  '/settings',
  requireAuth,
  settings.getSettings
);

router.patch(
  '/settings',
  requireAuth,
  trackActivity,
  validate(profileSchema),
  settings.updateSettings
);

// --------------------------------------------------
// SEARCH
// --------------------------------------------------

router.get(
  '/search',
  requireAuth,
  trackActivity,
  search.search
);

// --------------------------------------------------
// HEALTH
// --------------------------------------------------

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
  });
});

export default router;
