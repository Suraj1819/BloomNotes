
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

import { FontSize } from '../../components/editor/extensions/FontSize.js';
import { ResizableImage } from '../../components/editor/extensions/ResizableImage.js';
import { ShapeExtension } from '../../components/editor/extensions/ShapeExtension.js';

import { toast } from 'sonner';

import {
  ArrowLeft,
  Pin,
  Star,
  Trash2,
  Archive,
  Folder as FolderIcon,
  Tag as TagIcon,
  X,
  Check,
  Loader2,
  AlertCircle,
  WifiOff,
  Save,
  RefreshCw,
  Plus,
  Pencil,
  FileText,
  Clock3,
} from 'lucide-react';

import {
  notesApi,
  foldersApi,
  tagsApi,
} from '../../services/index.js';

import { useTheme } from '../../contexts/ThemeContext.jsx';

import {
  getThemeMeta,
  NOTE_THEMES,
} from '../../lib/noteThemes.js';

import { EditorToolbar } from '../../components/editor/EditorToolbar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';

import {
  countWords,
  excerptFromContent,
} from '../../lib/utils.js';

import lavenderBackground from '../../../assets/background/lavender.png';

const EMPTY_CONTENT = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const SAVE_DEBOUNCE = 900;
const SAVE_RETRY_DELAY = 300;
const FEEDBACK_DURATION = 1500;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function normalizeTitle(value) {
  return String(value || '').trim() || 'Untitled note';
}

function createSnapshot(title, content) {
  return JSON.stringify({
    title: normalizeTitle(title),
    content,
  });
}

function getNoteContent(note) {
  if (
    note?.content &&
    typeof note.content === 'object' &&
    !Array.isArray(note.content)
  ) {
    return note.content;
  }

  return EMPTY_CONTENT;
}

// -----------------------------------------------------------------------------
// Save Indicator
// -----------------------------------------------------------------------------

function SaveIndicator({ state, lastSavedAt }) {
  const commonClass =
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs';

  if (state === 'saving') {
    return (
      <span className={`${commonClass} bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400`}>
        <Loader2 size={12} className="animate-spin" />
        Saving
      </span>
    );
  }

  if (state === 'unsaved') {
    return (
      <span className={`${commonClass} bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400`}>
        <AlertCircle size={12} />
        Unsaved changes
      </span>
    );
  }

  if (state === 'saved') {
    return (
      <span
        className={`${commonClass} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400`}
        title={
          lastSavedAt
            ? `Last saved at ${lastSavedAt.toLocaleTimeString()}`
            : 'All changes saved'
        }
      >
        <Check size={12} />
        Saved
      </span>
    );
  }

  if (state === 'offline') {
    return (
      <span className={`${commonClass} bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400`}>
        <WifiOff size={12} />
        Offline
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className={`${commonClass} bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400`}>
        <AlertCircle size={12} />
        Save failed
      </span>
    );
  }

  return null;
}

// -----------------------------------------------------------------------------
// Action Button
// -----------------------------------------------------------------------------

function IconButton({
  icon: Icon,
  label,
  busyLabel,
  doneLabel,
  onClick,
  active = false,
  danger = false,
  disabled = false,
  loading = false,
  done = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={loading ? busyLabel : label}
      aria-label={loading ? busyLabel : label}
      className={`
        inline-flex h-9 min-w-fit shrink-0 items-center justify-center
        gap-1.5 rounded-xl border px-3
        text-[11px] font-semibold sm:text-xs
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-sm
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-violet-400
        disabled:cursor-not-allowed disabled:opacity-60
        ${
          danger
            ? 'border-red-100 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'
            : done
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
              : active
                ? 'border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300'
                : 'border-purple-100 bg-white/80 text-slate-600 hover:border-purple-200 hover:bg-purple-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
        }
      `}
    >
      {loading ? (
        <Loader2 size={14} className="shrink-0 animate-spin" />
      ) : done ? (
        <Check size={14} className="shrink-0" />
      ) : (
        <Icon size={14} strokeWidth={2} className="shrink-0" />
      )}

      <span className="whitespace-nowrap">
        {loading
          ? busyLabel
          : done
            ? doneLabel
            : label}
      </span>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Note Editor
// -----------------------------------------------------------------------------

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    setActiveNoteTheme,
    clearActiveNoteTheme,
  } = useTheme();

  const isNew = id === 'new';

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const {
    data: note,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.get(id),
    enabled: !isNew,
    retry: 1,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');

  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);

  const [saveState, setSaveState] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const [saveFeedback, setSaveFeedback] = useState('');
  const [refreshFeedback, setRefreshFeedback] = useState('');

  const [pinFeedback, setPinFeedback] = useState(false);
  const [pinFeedbackLabel, setPinFeedbackLabel] = useState('');

  const [favoriteFeedback, setFavoriteFeedback] = useState(false);
  const [favoriteFeedbackLabel, setFavoriteFeedbackLabel] = useState('');

  const [archiveFeedback, setArchiveFeedback] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState(false);

  const [folderFeedback, setFolderFeedback] = useState(false);
  const [tagFeedback, setTagFeedback] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  const initialNoteRef = useRef(null);
  const titleRef = useRef('');
  const noteRef = useRef(null);
  const editorRef = useRef(null);

  const saveTimerRef = useRef(null);
  const lastSavedSnapshotRef = useRef(null);

  const savingInFlightRef = useRef(false);
  const saveRequestedRef = useRef(false);
  const saveNowRef = useRef(null);

  const mountedRef = useRef(false);
  const createStartedRef = useRef(false);
  const initializedNoteIdRef = useRef(null);

  const saveFeedbackTimerRef = useRef(null);
  const refreshFeedbackTimerRef = useRef(null);
  const pinFeedbackTimerRef = useRef(null);
  const favoriteFeedbackTimerRef = useRef(null);
  const folderFeedbackTimerRef = useRef(null);
  const tagFeedbackTimerRef = useRef(null);
  const navigationTimerRef = useRef(null);

  const manualSaveInFlightRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  titleRef.current = title;
  noteRef.current = note;

  // ---------------------------------------------------------------------------
  // Tiptap Editor
  // ---------------------------------------------------------------------------

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),

      Underline,

      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),

      TaskList,

      TaskItem.configure({
        nested: true,
      }),

      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),

      TextStyle,
      FontSize,
      FontFamily,
      Color,

      Highlight.configure({
        multicolor: true,
      }),

      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
      }),

      TableRow,
      TableHeader,
      TableCell,

      ResizableImage,
      ShapeExtension,

      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),

      CharacterCount,
    ],

    content: EMPTY_CONTENT,

    editorProps: {
      attributes: {
        class: [
          'ProseMirror',
          'w-full min-h-full',
          'px-5 py-6 sm:px-10 sm:py-9',
          'text-[15px] leading-8',
          'text-gray-800 dark:text-gray-200',
          'outline-none',
        ].join(' '),

        spellcheck: 'true',
      },

      handleKeyDown: (view, event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 's'
        ) {
          event.preventDefault();
          saveNowRef.current?.();
          return true;
        }

        return false;
      },
    },
  });

  editorRef.current = editor;

  // ---------------------------------------------------------------------------
  // Snapshot
  // ---------------------------------------------------------------------------

  const getCurrentSnapshot = useCallback(() => {
    const currentEditor = editorRef.current;

    if (!currentEditor) return null;

    const content = currentEditor.getJSON();
    const currentTitle = titleRef.current;

    return {
      content,
      title: normalizeTitle(currentTitle),
      snapshot: createSnapshot(currentTitle, content),
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Save Note
  // ---------------------------------------------------------------------------

  const saveNow = useCallback(async () => {
    const currentNote = noteRef.current;
    const currentEditor = editorRef.current;

    if (!currentNote?.id || !currentEditor || isNew) {
      return false;
    }

    const current = getCurrentSnapshot();

    if (!current) return false;

    if (current.snapshot === lastSavedSnapshotRef.current) {
      if (mountedRef.current && !savingInFlightRef.current) {
        setSaveState('saved');
      }

      return true;
    }

    if (savingInFlightRef.current) {
      saveRequestedRef.current = true;
      return false;
    }

    if (!navigator.onLine) {
      if (mountedRef.current) {
        setSaveState('offline');
      }

      return false;
    }

    savingInFlightRef.current = true;
    saveRequestedRef.current = false;

    if (mountedRef.current) {
      setSaveState('saving');
    }

    const sentSnapshot = current.snapshot;
    let saveSucceeded = false;

    try {
      const patch = {
        title: current.title,
        content: current.content,
        excerpt: excerptFromContent(current.content, 200),
        word_count: countWords(currentEditor.getText() || ''),
      };

      const updated = await notesApi.update(
        currentNote.id,
        patch
      );

      lastSavedSnapshotRef.current = sentSnapshot;

      if (initialNoteRef.current) {
        initialNoteRef.current = {
          ...initialNoteRef.current,
          ...patch,
          updated_at:
            updated?.updated_at || new Date().toISOString(),
        };
      }

      if (updated && typeof updated === 'object') {
        qc.setQueryData(
          ['note', currentNote.id],
          (previous) => ({
            ...(previous || {}),
            ...updated,
          })
        );
      }

      qc.invalidateQueries({
        queryKey: ['notes'],
      });

      saveSucceeded = true;

      if (mountedRef.current) {
        setLastSavedAt(new Date());
      }

      return true;
    } catch (e) {
      console.error('[BloomNotes] Note save failed:', e);

      if (mountedRef.current) {
        setSaveState('error');
      }

      return false;
    } finally {
      savingInFlightRef.current = false;

      const latest = getCurrentSnapshot();

      const hasNewChanges =
        latest &&
        latest.snapshot !== lastSavedSnapshotRef.current;

      const shouldSaveAgain =
        saveRequestedRef.current || hasNewChanges;

      saveRequestedRef.current = false;

      if (!mountedRef.current) return;

      if (shouldSaveAgain && saveSucceeded) {
        setSaveState('unsaved');

        clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(() => {
          saveNowRef.current?.();
        }, SAVE_RETRY_DELAY);
      } else if (saveSucceeded) {
        setSaveState('saved');
      }
    }
  }, [getCurrentSnapshot, isNew, qc]);

  saveNowRef.current = saveNow;

  // ---------------------------------------------------------------------------
  // Debounced Save
  // ---------------------------------------------------------------------------

  const scheduleSave = useCallback(() => {
    if (isNew || !noteRef.current?.id) return;

    if (mountedRef.current) {
      setSaveState('unsaved');
    }

    clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      saveNowRef.current?.();
    }, SAVE_DEBOUNCE);
  }, [isNew]);

  // ---------------------------------------------------------------------------
  // Mount / Unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      clearTimeout(saveTimerRef.current);
      clearTimeout(saveFeedbackTimerRef.current);
      clearTimeout(refreshFeedbackTimerRef.current);
      clearTimeout(pinFeedbackTimerRef.current);
      clearTimeout(favoriteFeedbackTimerRef.current);
      clearTimeout(folderFeedbackTimerRef.current);
      clearTimeout(tagFeedbackTimerRef.current);
      clearTimeout(navigationTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Initialize Note
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isNew) {
      if (createStartedRef.current) return;

      createStartedRef.current = true;

      const createNote = async () => {
        try {
          const created = await notesApi.create({
            title: 'Untitled note',
          });

          if (!created?.id) {
            throw new Error('The server did not return a note ID.');
          }

          navigate(`/app/notes/${created.id}`, {
            replace: true,
          });
        } catch (e) {
          console.error('[BloomNotes] Note creation failed:', e);

          createStartedRef.current = false;

          toast.error(e?.message || 'Could not create note');
          navigate('/app/notes');
        }
      };

      createNote();
      return;
    }

    if (!note || !editor) return;

    if (initializedNoteIdRef.current === note.id) return;

    initializedNoteIdRef.current = note.id;

    const content = getNoteContent(note);
    const noteTitle = note.title || 'Untitled note';

    initialNoteRef.current = note;
    noteRef.current = note;

    titleRef.current = noteTitle;

    lastSavedSnapshotRef.current = createSnapshot(
      noteTitle,
      content
    );

    setTitle(noteTitle);
    setFolderId(note.folder_id || '');

    setSelectedTags(
      (note.tags || []).map((tag) => tag.id)
    );

    editor.commands.setContent(content, false);

    setActiveNoteTheme(note.theme_id);
    setSaveState('saved');

    notesApi.touchOpened(note.id).catch((e) => {
      console.warn(
        '[BloomNotes] Could not update last opened timestamp:',
        e?.message
      );
    });
  }, [
    note,
    editor,
    isNew,
    navigate,
    setActiveNoteTheme,
  ]);

  // ---------------------------------------------------------------------------
  // Clear Active Theme
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearActiveNoteTheme();
    };
  }, [clearActiveNoteTheme]);

  // ---------------------------------------------------------------------------
  // Editor Update Listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!editor || !note || isNew) return;

    if (initialNoteRef.current?.id !== note.id) return;

    const handleEditorUpdate = () => {
      scheduleSave();
    };

    editor.on('update', handleEditorUpdate);

    return () => {
      editor.off('update', handleEditorUpdate);
    };
  }, [editor, note, isNew, scheduleSave]);

  // ---------------------------------------------------------------------------
  // Title Change
  // ---------------------------------------------------------------------------

  const handleTitleChange = (event) => {
    const value = event.target.value;

    titleRef.current = value;
    setTitle(value);

    scheduleSave();
  };

  // ---------------------------------------------------------------------------
  // Manual Save
  // ---------------------------------------------------------------------------

  const handleManualSave = async () => {
    if (manualSaveInFlightRef.current) return;

    manualSaveInFlightRef.current = true;

    clearTimeout(saveTimerRef.current);
    clearTimeout(saveFeedbackTimerRef.current);

    setSaveFeedback('Saving...');

    try {
      const saved = await saveNowRef.current?.();

      if (saved) {
        setSaveFeedback('Saved');
        toast.success('Note saved');

        saveFeedbackTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setSaveFeedback('');
          }
        }, FEEDBACK_DURATION);
      } else {
        setSaveFeedback('');

        if (!navigator.onLine) {
          toast.error('You are offline. Changes could not be saved.');
        } else {
          toast.error('Could not save note');
        }
      }
    } finally {
      manualSaveInFlightRef.current = false;
    }
  };

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  const handleRefresh = async () => {
    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;

    clearTimeout(saveTimerRef.current);
    clearTimeout(refreshFeedbackTimerRef.current);

    setRefreshing(true);
    setRefreshFeedback('');

    try {
      const current = getCurrentSnapshot();

      if (
        current &&
        current.snapshot !== lastSavedSnapshotRef.current
      ) {
        const saved = await saveNowRef.current?.();

        if (!saved) {
          toast.error('Save your changes before refreshing');
          return;
        }
      }

      const result = await refetch();

      if (result.isError) {
        throw result.error || new Error('Could not refresh note');
      }

      setRefreshFeedback('Refreshed');
      toast.success('Note refreshed');

      refreshFeedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setRefreshFeedback('');
        }
      }, FEEDBACK_DURATION);
    } catch (error) {
      setRefreshFeedback('');
      toast.error(error?.message || 'Could not refresh note');
    } finally {
      refreshInFlightRef.current = false;

      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Online / Offline
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleOnline = () => {
      if (mountedRef.current) {
        saveNowRef.current?.();
      }
    };

    const handleOffline = () => {
      if (mountedRef.current) {
        setSaveState('offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Pin
  // ---------------------------------------------------------------------------

  const togglePin = useMutation({
    mutationFn: () =>
      note.is_pinned
        ? notesApi.unpin(note.id)
        : notesApi.pin(note.id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['note', id] });
      qc.invalidateQueries({ queryKey: ['notes'] });

      setPinFeedbackLabel(
        note.is_pinned ? 'Unpinned' : 'Pinned'
      );
      setPinFeedback(true);

      clearTimeout(pinFeedbackTimerRef.current);

      pinFeedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setPinFeedback(false);
          setPinFeedbackLabel('');
        }
      }, FEEDBACK_DURATION);

      toast.success(note.is_pinned ? 'Note unpinned' : 'Note pinned');
    },

    onError: (e) => {
      toast.error(e?.message || 'Could not update pin');
    },
  });

  // ---------------------------------------------------------------------------
  // Favorite
  // ---------------------------------------------------------------------------

  const toggleFav = useMutation({
    mutationFn: () => notesApi.toggleFavorite(note.id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['note', id] });
      qc.invalidateQueries({ queryKey: ['notes'] });

      setFavoriteFeedbackLabel(
        note.is_favorite ? 'Removed' : 'Added'
      );
      setFavoriteFeedback(true);

      clearTimeout(favoriteFeedbackTimerRef.current);

      favoriteFeedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setFavoriteFeedback(false);
          setFavoriteFeedbackLabel('');
        }
      }, FEEDBACK_DURATION);

      toast.success(
        note.is_favorite
          ? 'Removed from favorites'
          : 'Added to favorites'
      );
    },

    onError: (e) => {
      toast.error(e?.message || 'Could not update favorite');
    },
  });

  // ---------------------------------------------------------------------------
  // Archive
  // ---------------------------------------------------------------------------

  const archive = useMutation({
    mutationFn: () => notesApi.archive(note.id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });

      setArchiveFeedback(true);
      toast.success('Note archived');

      navigationTimerRef.current = setTimeout(() => {
        navigate('/app/notes');
      }, 1000);
    },

    onError: (e) => {
      toast.error(e?.message || 'Could not archive note');
    },
  });

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const remove = useMutation({
    mutationFn: () => notesApi.remove(note.id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });

      setDeleteFeedback(true);
      toast.success('Moved to trash');

      navigationTimerRef.current = setTimeout(() => {
        navigate('/app/notes');
      }, 1000);
    },

    onError: (e) => {
      toast.error(e?.message || 'Could not delete note');
    },
  });

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  const setTagsMutation = useMutation({
    mutationFn: (tagIds) => notesApi.setTags(note.id, tagIds),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['note', id] });
      qc.invalidateQueries({ queryKey: ['notes'] });

      setTagFeedback(true);

      clearTimeout(tagFeedbackTimerRef.current);

      tagFeedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setTagFeedback(false);
        }
      }, FEEDBACK_DURATION);

      toast.success('Tags updated');
    },

    onError: (e) => {
      toast.error(e?.message || 'Could not update tags');
    },
  });

  // ---------------------------------------------------------------------------
  // Folder
  // ---------------------------------------------------------------------------

  const setFolder = useMutation({
    mutationFn: (nextFolderId) =>
      notesApi.update(note.id, {
        folder_id: nextFolderId || null,
      }),

    onSuccess: (updated) => {
      if (updated) {
        qc.setQueryData(
          ['note', id],
          (previous) => ({
            ...(previous || {}),
            ...updated,
          })
        );
      }

      qc.invalidateQueries({ queryKey: ['notes'] });

      setFolderFeedback(true);

      clearTimeout(folderFeedbackTimerRef.current);

      folderFeedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setFolderFeedback(false);
        }
      }, FEEDBACK_DURATION);

      toast.success('Folder updated');
    },

    onError: (e) => {
      toast.error(e?.message || 'Could not update folder');
    },
  });

  // ---------------------------------------------------------------------------
  // Create Folder
  // ---------------------------------------------------------------------------

  const createFolder = useMutation({
    mutationFn: (name) => foldersApi.create({ name }),

    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['folders'] });

      if (created?.id) {
        setFolderId(created.id);
        setFolder.mutate(created.id);
      }

      setFolderName('');
      setFolderDialogOpen(false);

      toast.success('Folder created');
    },

    onError: (e) => {
      toast.error(e?.message || 'Could not create folder');
    },
  });

  const handleCreateFolder = (event) => {
    event.preventDefault();

    const name = folderName.trim();

    if (!name) {
      toast.error('Enter a folder name');
      return;
    }

    createFolder.mutate(name);
  };

  const handleFolderChange = (event) => {
    const value = event.target.value;

    setFolderId(value);
    setFolder.mutate(value);
  };

  // ---------------------------------------------------------------------------
  // Tag Selection
  // ---------------------------------------------------------------------------

  const toggleSelectedTag = (tagId) => {
    setSelectedTags((previous) => {
      if (previous.includes(tagId)) {
        return previous.filter((item) => item !== tagId);
      }

      return [...previous, tagId];
    });
  };

  const removeTag = (tagId) => {
    const next = selectedTags.filter((item) => item !== tagId);

    setSelectedTags(next);
    setTagsMutation.mutate(next);
  };

  const applyTags = () => {
    setTagsMutation.mutate(selectedTags);
    setTagPickerOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Delete Confirmation
  // ---------------------------------------------------------------------------

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Are you sure you want to move this note to trash?'
    );

    if (confirmed) {
      remove.mutate();
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / Error
  // ---------------------------------------------------------------------------

  if (isLoading && !isNew) {
    return <PageLoader label="Loading note..." />;
  }

  if (isError && !isNew) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10">
          <AlertCircle size={28} className="text-rose-500" />
        </div>

        <h2 className="text-lg font-semibold text-text-main">
          Unable to load note
        </h2>

        <p className="max-w-md text-sm text-text-muted">
          {error?.message ||
            'Something went wrong while loading this note.'}
        </p>

        <Button
          variant="outline"
          onClick={() => navigate('/app/notes')}
        >
          <ArrowLeft size={15} />
          Back to notes
        </Button>
      </div>
    );
  }

  if (!note && !isNew) {
    return <PageLoader label="Loading note..." />;
  }

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------

  const theme = note
    ? getThemeMeta(note.theme_id) || NOTE_THEMES[0]
    : NOTE_THEMES[0];

  const wordCount = countWords(editor?.getText() || '');

  const characterCount =
    editor?.storage.characterCount?.characters?.() || 0;

  const anyActionPending =
    togglePin.isPending ||
    toggleFav.isPending ||
    archive.isPending ||
    remove.isPending ||
    setFolder.isPending ||
    setTagsMutation.isPending ||
    createFolder.isPending;

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <div
      className="
        relative isolate mx-auto flex h-full min-h-0 w-full
        max-w-7xl flex-col overflow-hidden bg-background
        px-0 sm:px-4 sm:py-4 lg:px-6
      "
      style={{
        backgroundImage: `url(${lavenderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background Overlay */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-white/10 dark:bg-slate-950/10
        "
      />

      {/* Header */}

      <div className="
        relative z-20 flex shrink-0 flex-col
        items-stretch gap-2
        border-b border-purple-100/70
        bg-white/75 px-3 py-2.5 backdrop-blur-xl
        dark:border-white/10 dark:bg-slate-950/70
        sm:mb-4 sm:flex-row sm:items-center
        sm:justify-between sm:gap-3
        sm:rounded-2xl sm:border
        sm:px-4 sm:py-3
        sm:shadow-[0_4px_20px_rgba(100,70,140,0.05)]
      ">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/notes')}
            title="Back to notes"
            aria-label="Back to notes"
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-xl text-slate-500 transition
              hover:bg-purple-50 hover:text-purple-700
              dark:text-slate-400 dark:hover:bg-white/10
              dark:hover:text-white
            "
          >
            <ArrowLeft size={19} />
          </button>

          <div className="hidden h-7 w-px bg-purple-100 dark:bg-white/10 sm:block" />

          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${theme.swatch}18`,
              color: theme.swatch,
            }}
          >
            <FileText size={17} />
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <span className="max-w-[110px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200 sm:max-w-none sm:text-sm">
              {theme.name}
            </span>

            <SaveIndicator
              state={saveState}
              lastSavedAt={lastSavedAt}
            />
          </div>
        </div>

        {/* Right Side - Mobile Scrollable Actions */}

        <div className="
          -mx-3 w-[calc(100%+1.5rem)] min-w-0
          overflow-x-auto overscroll-x-contain
          px-3 pb-1
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          sm:mx-0 sm:w-auto sm:overflow-visible
          sm:px-0 sm:pb-0
        ">
          <div className="
            flex min-w-max items-center justify-start gap-2
            sm:min-w-0 sm:justify-end sm:gap-2
          ">
            <IconButton
              icon={RefreshCw}
              label="Refresh"
              busyLabel="Refreshing..."
              doneLabel="Refreshed"
              onClick={handleRefresh}
              loading={refreshing}
              done={refreshFeedback === 'Refreshed'}
              disabled={anyActionPending || refreshing}
            />

            <IconButton
              icon={Pin}
              label="Pin"
              busyLabel={note?.is_pinned ? 'Unpinning...' : 'Pinning...'}
              doneLabel={pinFeedbackLabel || 'Pinned'}
              active={note?.is_pinned}
              onClick={() => togglePin.mutate()}
              loading={togglePin.isPending}
              done={pinFeedback}
              disabled={anyActionPending || refreshing}
            />

            <IconButton
              icon={Star}
              label="Favorite"
              busyLabel={
                note?.is_favorite ? 'Removing...' : 'Adding...'
              }
              doneLabel={favoriteFeedbackLabel || 'Added'}
              active={note?.is_favorite}
              onClick={() => toggleFav.mutate()}
              loading={toggleFav.isPending}
              done={favoriteFeedback}
              disabled={anyActionPending || refreshing}
            />

            <IconButton
              icon={Archive}
              label="Archive"
              busyLabel="Archiving..."
              doneLabel="Archived"
              onClick={() => archive.mutate()}
              loading={archive.isPending}
              done={archiveFeedback}
              disabled={anyActionPending || refreshing}
            />

            <IconButton
              icon={Trash2}
              label="Delete"
              busyLabel="Deleting..."
              doneLabel="Deleted"
              danger
              onClick={handleDelete}
              loading={remove.isPending}
              done={deleteFeedback}
              disabled={anyActionPending || refreshing}
            />

            <IconButton
              icon={Save}
              label="Save"
              busyLabel="Saving..."
              doneLabel="Saved"
              onClick={handleManualSave}
              loading={
                saveFeedback === 'Saving...' ||
                saveState === 'saving'
              }
              done={saveFeedback === 'Saved'}
              disabled={
                saveState === 'saving' ||
                saveFeedback === 'Saving...' ||
                anyActionPending ||
                refreshing
              }
            />
          </div>
        </div>
      </div>

      {/* Note Details */}

      <div className="
        relative z-10 shrink-0
        rounded-none border-b border-purple-100/60
        bg-white/30 px-4 py-4
        dark:border-white/5 dark:bg-transparent
        sm:mb-3 sm:rounded-2xl sm:border
        sm:bg-white/40 sm:px-5 sm:py-4
        sm:backdrop-blur-sm
        dark:sm:bg-slate-900/30
      ">
        <div className="flex items-center gap-2">
          <input
            value={title}
            onChange={handleTitleChange}
            onBlur={() => {
              clearTimeout(saveTimerRef.current);
              saveNowRef.current?.();
            }}
            placeholder="Untitled note"
            aria-label="Note title"
            className="
              min-w-0 flex-1 border-0 bg-transparent p-0
              text-2xl font-bold tracking-tight
              text-slate-800 outline-none
              placeholder:text-slate-300 focus:ring-0
              dark:text-slate-100 dark:placeholder:text-slate-600
              sm:text-3xl lg:text-4xl
            "
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* Folder */}

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
              <FolderIcon size={15} />
            </div>

            <div className="w-[125px] min-w-0 sm:w-[155px]">
              <Select
                value={folderId}
                onChange={handleFolderChange}
                disabled={setFolder.isPending}
                className="w-full"
              >
                <option value="">No folder</option>

                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Select>
            </div>

            <button
              type="button"
              onClick={() => {
                setFolderName('');
                setFolderDialogOpen(true);
              }}
              className="
                flex h-8 shrink-0 items-center gap-1.5
                rounded-lg border border-purple-100
                bg-white/70 px-2.5
                text-xs font-medium text-purple-700
                transition-all hover:border-purple-300
                hover:bg-purple-50
                dark:border-white/10 dark:bg-white/5
                dark:text-purple-300 dark:hover:bg-white/10
              "
            >
              <Plus size={13} />
              <span className="hidden sm:inline">New folder</span>
              <span className="sm:hidden">Add</span>
            </button>

            {folderFeedback && (
              <span className="hidden items-center gap-1 text-xs text-emerald-600 sm:flex">
                <Check size={12} />
                Updated
              </span>
            )}
          </div>

          <div className="hidden h-6 w-px bg-purple-100 dark:bg-white/10 sm:block" />

          {/* Tags */}

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300">
              <TagIcon size={14} />
            </div>

            {(note?.tags || []).map((tag) => (
              <span
                key={tag.id}
                className="
                  inline-flex items-center gap-1.5
                  rounded-full border border-purple-100
                  bg-white/80 px-2.5 py-1
                  text-[11px] font-medium text-purple-700
                  dark:border-purple-400/20
                  dark:bg-purple-500/10 dark:text-purple-300
                "
              >
                {tag.name}

                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  aria-label={`Remove ${tag.name}`}
                  disabled={setTagsMutation.isPending}
                  className="rounded-full p-0.5 transition hover:bg-purple-100 hover:text-red-500 disabled:opacity-50 dark:hover:bg-white/10"
                >
                  <X size={11} />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={() => setTagPickerOpen(true)}
              className="
                inline-flex h-7 items-center gap-1
                rounded-full border border-dashed
                border-purple-200 px-3
                text-[11px] font-semibold text-purple-600
                transition-all hover:border-purple-400
                hover:bg-purple-50
                dark:border-purple-400/30
                dark:text-purple-300 dark:hover:bg-purple-500/10
              "
            >
              <Plus size={12} />
              Add tag
            </button>

            {tagFeedback && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <Check size={12} />
                Updated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Toolbar */}

      <div className="
        relative z-10 hidden shrink-0
        overflow-x-auto rounded-xl
        border border-purple-100/70
        bg-white/80 shadow-sm backdrop-blur-xl
        dark:border-white/10 dark:bg-slate-900/70
        sm:mb-3 sm:block
      ">
        <EditorToolbar editor={editor} />
      </div>

      {/* Mobile Toolbar */}

      {mobileToolbarOpen && (
        <div className="
          relative z-10 shrink-0 overflow-x-auto
          border-y border-purple-100
          bg-white/95 px-2 py-2 shadow-sm
          dark:border-white/10 dark:bg-slate-900
          sm:hidden
        ">
          <div className="min-w-max">
            <EditorToolbar editor={editor} />
          </div>
        </div>
      )}

      {/* Editor Workspace */}

      <div className="
        relative z-0 flex min-h-0 flex-1 flex-col
        overflow-hidden
        border-y border-purple-100/70
        bg-white/80
        dark:border-white/10 dark:bg-slate-950/70
        sm:rounded-2xl sm:border
        sm:shadow-[0_8px_30px_rgba(100,70,140,0.06)]
      ">
        <div
          className="h-[3px] w-full shrink-0 opacity-80"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.swatch}, transparent)`,
          }}
        />

        <div className="
          min-h-0 flex-1
          overflow-x-hidden overflow-y-auto
          overscroll-contain
        ">
          <EditorContent
            editor={editor}
            className="min-h-full"
          />
        </div>
      </div>

      {/* Footer */}

      <div className="
        z-10 flex shrink-0 items-center
        justify-between gap-3
        border-t border-purple-100/70
        bg-white/80 px-4 py-2.5
        dark:border-white/10 dark:bg-slate-950/70
        sm:mt-3 sm:rounded-xl sm:border
        sm:px-4 sm:py-2
        sm:backdrop-blur-xl
      ">
        <div className="
          flex items-center gap-3
          text-[11px] font-medium text-slate-500
          dark:text-slate-400 sm:text-xs
        ">
          <span className="inline-flex items-center gap-1.5">
            <FileText size={12} />
            {wordCount} words
          </span>

          <span className="hidden h-3 w-px bg-slate-200 dark:bg-white/10 sm:block" />

          <span className="hidden sm:inline">
            {characterCount} characters
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileToolbarOpen((value) => !value)}
          className="
            flex h-8 shrink-0 items-center gap-1.5
            rounded-lg border border-purple-200
            bg-purple-50 px-3
            text-xs font-semibold text-purple-700
            transition hover:bg-purple-100
            dark:border-purple-500/20
            dark:bg-purple-500/10
            dark:text-purple-300
            sm:hidden
          "
        >
          <Pencil size={13} />
          {mobileToolbarOpen ? 'Done' : 'Edit'}
        </button>

        <span className="hidden items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:flex">
          <Clock3 size={12} />
          {theme.name}
        </span>
      </div>

      {/* Create Folder Dialog */}

      <Dialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        title="Create folder"
      >
        <form
          onSubmit={handleCreateFolder}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-main">
              Folder name
            </label>

            <input
              autoFocus
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Enter folder name"
              className="
                w-full rounded-xl border border-gray-200
                bg-white px-3 py-2.5 text-sm text-gray-800
                outline-none transition
                focus:border-violet-400 focus:ring-2
                focus:ring-violet-100
                dark:border-white/10 dark:bg-gray-900
                dark:text-white dark:focus:ring-violet-500/10
              "
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFolderDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={createFolder.isPending}
            >
              {createFolder.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {createFolder.isPending ? 'Creating...' : 'Create folder'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Tag Picker Dialog */}

      <Dialog
        open={tagPickerOpen}
        onClose={() => setTagPickerOpen(false)}
        title="Manage tags"
        size="md"
      >
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {tags.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">
              No tags available. Create tags from the Tags page.
            </p>
          ) : (
            tags.map((tag) => (
              <label
                key={tag.id}
                className="
                  flex cursor-pointer items-center gap-3
                  rounded-xl px-3 py-2.5 transition
                  hover:bg-purple-50 dark:hover:bg-white/5
                "
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => toggleSelectedTag(tag.id)}
                  className="h-4 w-4 accent-violet-600"
                />

                <span className="text-sm text-text-main">
                  {tag.name}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedTags(
                (note?.tags || []).map((tag) => tag.id)
              );

              setTagPickerOpen(false);
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={applyTags}
            disabled={setTagsMutation.isPending}
          >
            {setTagsMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {setTagsMutation.isPending ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
