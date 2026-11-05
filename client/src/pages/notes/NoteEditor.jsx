
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
    'flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs';

  if (state === 'saving') {
    return (
      <span className={`${commonClass} text-violet-600 dark:text-violet-400`}>
        <Loader2 size={13} className="animate-spin" />
        Saving
      </span>
    );
  }

  if (state === 'unsaved') {
    return (
      <span className={`${commonClass} text-amber-600 dark:text-amber-400`}>
        <AlertCircle size={13} />
        Unsaved
      </span>
    );
  }

  if (state === 'saved') {
    return (
      <span
        className={`${commonClass} text-emerald-600 dark:text-emerald-400`}
        title={
          lastSavedAt
            ? `Last saved at ${lastSavedAt.toLocaleTimeString()}`
            : 'All changes saved'
        }
      >
        <Check size={13} />
        Saved
      </span>
    );
  }

  if (state === 'offline') {
    return (
      <span className={`${commonClass} text-amber-600`}>
        <WifiOff size={13} />
        Offline
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className={`${commonClass} text-red-500`}>
        <AlertCircle size={13} />
        Save failed
      </span>
    );
  }

  return null;
}

// -----------------------------------------------------------------------------
// Icon Button
// -----------------------------------------------------------------------------

function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  danger = false,
  disabled = false,
  loading = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={loading ? `${label}...` : label}
      aria-label={loading ? `${label}...` : label}
      className={`
        flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
        transition-colors disabled:cursor-not-allowed disabled:opacity-50
        sm:h-9 sm:w-9
        ${
          danger
            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
            : active
              ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'
        }
      `}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Icon size={16} />
      )}
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
    isFetching,
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
  const [favoriteFeedback, setFavoriteFeedback] = useState(false);
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
          'px-4 py-4 sm:px-8 sm:py-7',
          'text-[15px] leading-7',
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
    setRefreshFeedback('Refreshing...');

    try {
      const current = getCurrentSnapshot();

      if (
        current &&
        current.snapshot !== lastSavedSnapshotRef.current
      ) {
        setRefreshFeedback('Saving changes...');

        const saved = await saveNowRef.current?.();

        if (!saved) {
          toast.error('Save your changes before refreshing');
          setRefreshFeedback('');
          return;
        }
      }

      setRefreshFeedback('Refreshing...');

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

      setPinFeedback(true);

      clearTimeout(pinFeedbackTimerRef.current);

      pinFeedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setPinFeedback(false);
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

      setFavoriteFeedback(true);

      clearTimeout(favoriteFeedbackTimerRef.current);

      favoriteFeedbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setFavoriteFeedback(false);
        }
      }, FEEDBACK_DURATION);
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

      toast.success('Note archived');
      navigate('/app/notes');
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

      toast.success('Moved to trash');
      navigate('/app/notes');
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
        <AlertCircle size={32} className="text-rose-500" />

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

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <div className="
      mx-auto flex h-full min-h-0 w-full max-w-6xl
      flex-col overflow-hidden
      px-0 sm:px-5 sm:py-4
    ">

      {/* Header */}

      <div className="
        flex shrink-0 items-center justify-between gap-2
        border-b border-gray-200/70
        px-2 py-2
        dark:border-white/10
        sm:mb-4 sm:rounded-xl sm:border
        sm:bg-white/50 sm:px-4 sm:py-3
        dark:sm:bg-gray-900/40
      ">

        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            icon={ArrowLeft}
            label="Back to notes"
            onClick={() => navigate('/app/notes')}
          />

          <div className="hidden h-5 w-px bg-gray-300 dark:bg-white/15 sm:block" />

          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: theme.swatch }}
          />

          <span className="max-w-[75px] truncate text-xs text-text-muted sm:max-w-none sm:text-sm">
            {theme.name}
          </span>

          <div className="ml-0.5">
            <SaveIndicator
              state={saveState}
              lastSavedAt={lastSavedAt}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">

          <IconButton
            icon={RefreshCw}
            label={refreshFeedback || 'Refresh note'}
            onClick={handleRefresh}
            loading={refreshing}
            disabled={refreshing || isFetching}
          />

          <IconButton
            icon={Pin}
            label={note?.is_pinned ? 'Unpin note' : 'Pin note'}
            active={note?.is_pinned}
            onClick={() => togglePin.mutate()}
            loading={togglePin.isPending}
            disabled={togglePin.isPending}
          />

          <IconButton
            icon={Star}
            label={
              note?.is_favorite
                ? 'Remove favorite'
                : 'Add favorite'
            }
            active={note?.is_favorite}
            onClick={() => toggleFav.mutate()}
            loading={toggleFav.isPending}
            disabled={toggleFav.isPending}
          />

          <IconButton
            icon={Archive}
            label="Archive note"
            onClick={() => archive.mutate()}
            loading={archive.isPending}
            disabled={archive.isPending}
          />

          <IconButton
            icon={Trash2}
            label="Move to trash"
            danger
            onClick={handleDelete}
            loading={remove.isPending}
            disabled={remove.isPending}
          />

          <div className="mx-1 hidden h-5 w-px bg-gray-300 dark:bg-white/15 sm:block" />

          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={
              saveState === 'saving' ||
              manualSaveInFlightRef.current
            }
            className="h-8 min-w-[76px] gap-1.5 px-2 text-xs sm:h-9 sm:min-w-[90px] sm:px-3 sm:text-sm"
          >
            {saveFeedback === 'Saving...' || saveState === 'saving' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveFeedback === 'Saved' ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}

            <span>{saveFeedback || 'Save'}</span>
          </Button>
        </div>
      </div>

      {/* Note Title */}

      <div className="shrink-0 px-4 pt-3 sm:px-2 sm:pt-0">
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
            w-full border-0 bg-transparent p-0
            text-2xl font-semibold tracking-tight
            text-text-main outline-none
            placeholder:text-text-muted focus:ring-0
            sm:text-4xl
          "
        />
      </div>

      {/* Folder and Tags */}

      <div className="
        flex shrink-0 flex-wrap items-center
        gap-x-4 gap-y-2
        px-4 py-3 sm:px-2
      ">

        <div className="flex min-w-0 items-center gap-2">
          <FolderIcon
            size={15}
            className="shrink-0 text-text-muted"
          />

          <div className="w-[125px] min-w-0 sm:w-[150px]">
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
              flex h-8 shrink-0 items-center gap-1
              rounded-lg border border-gray-200
              bg-white/70 px-2
              text-xs font-medium text-gray-600
              transition hover:border-violet-300
              hover:text-violet-600
              dark:border-white/10 dark:bg-gray-900/40
              dark:text-gray-300
            "
          >
            <Plus size={13} />
            Add folder
          </button>

          {folderFeedback && (
            <span className="hidden items-center gap-1 text-xs text-emerald-600 sm:flex">
              <Check size={12} />
              Updated
            </span>
          )}
        </div>

        <div className="hidden h-5 w-px bg-gray-200 dark:bg-white/10 sm:block" />

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <TagIcon
            size={14}
            className="shrink-0 text-text-muted"
          />

          {(note?.tags || []).map((tag) => (
            <span
              key={tag.id}
              className="bn-chip"
            >
              {tag.name}

              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                aria-label={`Remove ${tag.name}`}
                disabled={setTagsMutation.isPending}
              >
                <X size={11} />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => setTagPickerOpen(true)}
            className="
              rounded-md border border-dashed
              border-gray-300 px-2 py-1
              text-xs text-text-muted transition
              hover:border-violet-400 hover:text-violet-600
              dark:border-white/20
            "
          >
            + Add tag
          </button>

          {tagFeedback && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check size={12} />
              Updated
            </span>
          )}
        </div>
      </div>

      {/* Desktop Toolbar */}

      <div className="hidden shrink-0 sm:block">
        <EditorToolbar editor={editor} />
      </div>

      {/* Mobile Toolbar */}

      {mobileToolbarOpen && (
        <div className="
          shrink-0 overflow-x-auto
          border-y border-gray-200
          bg-white px-2 py-2
          dark:border-white/10 dark:bg-gray-900
          sm:hidden
        ">
          <div className="min-w-max">
            <EditorToolbar editor={editor} />
          </div>
        </div>
      )}

      {/* Whiteboard */}

      <div className="
        flex min-h-0 flex-1 flex-col
        overflow-hidden
        border-y border-gray-200
        bg-white
        dark:border-white/10 dark:bg-gray-950
        sm:rounded-xl sm:border sm:shadow-sm
      ">
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
        z-20 flex shrink-0 items-center
        justify-between gap-3
        border-t border-gray-200
        bg-white px-4 py-2
        dark:border-white/10 dark:bg-gray-950
        sm:mt-3 sm:rounded-lg sm:border-0
        sm:bg-transparent sm:px-2 sm:py-1
      ">
        <div className="
          flex items-center gap-3
          text-[11px] text-text-muted sm:text-xs
        ">
          <span>{wordCount} words</span>
          <span>{characterCount} characters</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileToolbarOpen((value) => !value)}
          className="
            flex h-8 shrink-0 items-center gap-1.5
            rounded-lg border border-violet-200
            bg-violet-50 px-3
            text-xs font-medium text-violet-700
            transition hover:bg-violet-100
            dark:border-violet-500/20
            dark:bg-violet-500/10
            dark:text-violet-300
            sm:hidden
          "
        >
          <Pencil size={13} />
          {mobileToolbarOpen ? 'Done' : 'Edit'}
        </button>

        <span className="hidden text-xs text-text-muted sm:block">
          Theme: {theme.name}
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
                w-full rounded-lg border border-gray-200
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
                  rounded-lg px-3 py-2.5 transition
                  hover:bg-gray-50 dark:hover:bg-white/5
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
