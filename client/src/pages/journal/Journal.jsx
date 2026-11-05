
// src/pages/journal/Journal.jsx

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { toast } from 'sonner';

import { journalApi } from '../../services/index.js';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';

import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Search,
  X,
} from 'lucide-react';

import { excerptFromContent } from '../../lib/utils.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import lavenderBg from '../../../assets/background/lavender.png';
import noteFlower from '../../../assets/background/note-card-flower.png';

const MOODS = [
  { id: 'joyful', label: 'Joyful', emoji: '😄', color: '#D97706' },
  { id: 'happy', label: 'Happy', emoji: '🙂', color: '#CA8A04' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#0D9488' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#64748B' },
  { id: 'anxious', label: 'Anxious', emoji: '😟', color: '#D97706' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#6366F1' },
  { id: 'angry', label: 'Angry', emoji: '😠', color: '#DC2626' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#8B5CF6' },
];

const getToday = () => new Date().toISOString().slice(0, 10);

const formatDate = (date) => {
  if (!date) return '';

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function Journal() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState('calm');
  const [entryDate, setEntryDate] = useState(getToday());
  const [search, setSearch] = useState('');

  // Fetch journal entries
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['journal', { limit: 200 }],
    queryFn: () => journalApi.list({ limit: 200 }),
  });

  // Journal editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'How did today bloom?',
      }),
    ],
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editorProps: {
      attributes: {
        class:
          'ProseMirror min-h-[250px] p-4 outline-none text-[#51418F] dark:text-slate-300',
        style: 'font-family: Calibri, Arial, sans-serif;',
      },
    },
  });

  // Close editor
  const closeEditor = () => {
    setEditing(null);
    setTitle('');
    setMood('calm');
    setEntryDate(getToday());
    editor?.commands.clearContent();
  };

  // Create entry
  const create = useMutation({
    mutationFn: (body) => journalApi.create(body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      closeEditor();
      toast.success('Journal entry saved');
    },

    onError: (error) => toast.error(error.message),
  });

  // Update entry
  const update = useMutation({
    mutationFn: ({ id, body }) => journalApi.update(id, body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      closeEditor();
      toast.success('Journal entry updated');
    },

    onError: (error) => toast.error(error.message),
  });

  // Delete entry
  const remove = useMutation({
    mutationFn: (id) => journalApi.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Journal entry deleted');
    },

    onError: (error) => toast.error(error.message),
  });

  // Open editor
  const openEditor = (entry) => {
    setEditing(entry);

    if (entry && entry !== 'new') {
      setTitle(entry.title || '');
      setMood(entry.mood || 'calm');
      setEntryDate(entry.entry_date || getToday());

      editor?.commands.setContent(
        entry.content || {
          type: 'doc',
          content: [{ type: 'paragraph' }],
        }
      );
    } else {
      setTitle('');
      setMood('calm');
      setEntryDate(getToday());

      editor?.commands.clearContent();
    }
  };

  // Save entry
  const save = () => {
    if (!editor) return;

    const body = {
      title: title.trim(),
      mood,
      entry_date: entryDate,
      content: editor.getJSON(),
    };

    if (editing && editing !== 'new') {
      update.mutate({
        id: editing.id,
        body,
      });
    } else {
      create.mutate(body);
    }
  };

  // Delete confirmation
  const handleRemove = async (entry) => {
    const ok = await confirm({
      title: 'Delete journal entry?',
      description: `"${entry.title || 'Untitled entry'}" dated ${entry.entry_date} will be permanently deleted.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (ok) {
      remove.mutate(entry.id);
    }
  };

  const entries = data?.items || [];

  const filteredEntries = entries.filter((entry) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      entry.title?.toLowerCase().includes(query) ||
      entry.mood?.toLowerCase().includes(query) ||
      excerptFromContent(entry.content)?.toLowerCase().includes(query)
    );
  });

  const isSaving = create.isPending || update.isPending;

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center font-['Calibri',sans-serif]">
        <BookOpen
          size={32}
          className="mx-auto mb-3 text-text-muted"
        />

        <p className="mb-4 text-text-main">
          Unable to load journal entries.
        </p>

        <Button onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-full overflow-hidden font-['Calibri',sans-serif]"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-white/55 dark:bg-black/45" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] dark:bg-purple-950/50 dark:text-purple-400">
              <BookOpen size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#10123D] dark:text-slate-100 sm:text-3xl">
                My Journal
              </h1>

              <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
                Capture your thoughts, moods and everyday moments.
              </p>
            </div>
          </div>

          <Button
            onClick={() => openEditor('new')}
            className="self-start sm:self-auto"
          >
            <Plus size={16} />
            New entry
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#62529D]"
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search journal entries..."
              className="bg-white/75 pl-10 pr-10 dark:bg-slate-900/70"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <span className="text-sm font-medium text-[#51418F] dark:text-slate-400">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Journal heading */}
        <div className="mb-5 flex items-center justify-between border-b border-[#E8D8FF] pb-3 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-[#10123D] dark:text-slate-100">
              Your memories
            </h2>

            <p className="mt-0.5 text-sm text-[#51418F] dark:text-slate-400">
              Your personal collection of thoughts.
            </p>
          </div>
        </div>

        {/* Empty state */}
        {entries.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <EmptyState
              icon={BookOpen}
              title="No journal entries"
              description="Capture how today felt — moods, moments and gratitude."
              action={
                <Button onClick={() => openEditor('new')}>
                  <Plus size={15} />
                  New entry
                </Button>
              }
            />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <Search
              size={28}
              className="mx-auto mb-3 text-[#62529D]"
            />

            <p className="font-semibold text-[#10123D] dark:text-slate-100">
              No matching entries
            </p>

            <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
              Try searching with another keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {filteredEntries.map((entry) => {
              const moodMeta = MOODS.find(
                (item) => item.id === entry.mood
              );

              return (
                <article
                  key={entry.id}
                  className="group relative isolate flex min-h-[210px] flex-col overflow-hidden rounded-[22px] border border-[#E8D8FF] bg-white shadow-[0_4px_12px_rgba(91,55,150,0.09)] transition-all duration-300 hover:-translate-y-1 hover:border-[#CDA8FF] hover:shadow-[0_12px_28px_rgba(91,55,150,0.15)] dark:border-slate-700 dark:bg-slate-900"
                  style={{
                    fontFamily: 'Calibri, Arial, sans-serif',
                  }}
                >
                  {/* Floral background */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1 -right-1 z-0 h-[82%] w-[48%] bg-contain bg-right-bottom bg-no-repeat opacity-80 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${noteFlower})`,
                    }}
                  />

                  {/* Overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-white via-white/95 to-white/10 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/30"
                  />

                  <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">

                    {/* Card header */}
                    <div className="mb-4 flex items-start justify-between gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E8FF] text-2xl dark:bg-purple-950/50">
                        {moodMeta?.emoji || '📝'}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditor(entry)}
                          aria-label="Edit entry"
                          title="Edit"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#51418F] transition hover:bg-[#F1E8FF] dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          disabled={remove.isPending}
                          onClick={() => handleRemove(entry)}
                          aria-label="Delete entry"
                          title="Delete"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#51418F] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-[#10123D] dark:text-slate-100">
                      {entry.title || 'Untitled entry'}
                    </h3>

                    {/* Description */}
                    <p className="mb-4 line-clamp-3 max-w-[90%] text-sm leading-relaxed text-[#51418F] dark:text-slate-300">
                      {excerptFromContent(entry.content) ||
                        'A personal moment captured in your journal.'}
                    </p>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EDE2FA] pt-3 dark:border-slate-700">

                      <div className="flex min-w-0 items-center gap-2">
                        <CalendarDays
                          size={14}
                          className="shrink-0 text-[#62529D]"
                        />

                        <span className="truncate text-xs font-medium text-[#51418F] dark:text-slate-400">
                          {formatDate(entry.entry_date)}
                        </span>
                      </div>

                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          color: moodMeta?.color || '#64748B',
                          backgroundColor: `${moodMeta?.color || '#64748B'}15`,
                        }}
                      >
                        {moodMeta?.emoji || '📝'}
                        {moodMeta?.label || 'No mood'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}

          </div>
        )}
      </div>

      {/* Journal editor dialog */}
      <Dialog
        open={!!editing}
        onClose={() => {
          if (!isSaving) closeEditor();
        }}
        title={editing === 'new' ? 'New journal entry' : 'Edit entry'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeEditor}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              onClick={save}
              disabled={isSaving || !editor}
            >
              {isSaving ? 'Saving...' : 'Save entry'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-['Calibri',sans-serif]">

          <Field label="Title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Today's bloom"
              maxLength={150}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <Field label="Mood">
              <Select
                value={mood}
                onChange={(event) => setMood(event.target.value)}
              >
                {MOODS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.emoji} {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Date">
              <Input
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
              />
            </Field>

          </div>

          {/* Editor */}
          <Field label="Your thoughts">
            <div className="overflow-hidden rounded-2xl border border-[#E8D8FF] bg-white/90 shadow-sm focus-within:border-[#CDA8FF] dark:border-slate-700 dark:bg-slate-900/90">
              <EditorContent editor={editor} />
            </div>
          </Field>

        </div>
      </Dialog>
    </div>
  );
}
