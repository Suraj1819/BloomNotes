
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
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo2,
  Redo2,
  AlignLeft,
  Sparkles,
  PenLine,
} from 'lucide-react';

import { excerptFromContent } from '../../lib/utils.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';

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

const getToday = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
};

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

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['journal', { limit: 200 }],
    queryFn: () => journalApi.list({ limit: 200 }),
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          'Start writing your thoughts here...\n\nWhat happened today? What made you smile? What are you grateful for?',
      }),
    ],
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editorProps: {
      attributes: {
        class:
          'ProseMirror journal-prose min-h-[280px] px-5 py-5 sm:px-7 sm:py-6 outline-none text-[#51418F] dark:text-slate-200',
      },
    },
  });

  const closeEditor = () => {
    setEditing(null);
    setTitle('');
    setMood('calm');
    setEntryDate(getToday());
    editor?.commands.clearContent();
  };

  const create = useMutation({
    mutationFn: (body) => journalApi.create(body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      closeEditor();
      toast.success('Journal entry saved');
    },

    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => journalApi.update(id, body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      closeEditor();
      toast.success('Journal entry updated');
    },

    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => journalApi.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Journal entry deleted');
    },

    onError: (error) => toast.error(error.message),
  });

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

  const toolbarButton = (
    label,
    icon,
    action,
    isActive = false,
    disabled = false
  ) => {
    const Icon = icon;

    return (
      <button
        key={label}
        type="button"
        title={label}
        aria-label={label}
        disabled={disabled}
        onClick={action}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
          isActive
            ? 'bg-[#EDE4FF] text-[#7045C5] shadow-sm dark:bg-purple-500/20 dark:text-purple-300'
            : 'text-[#67578F] hover:bg-[#F2EDFA] hover:text-[#7045C5] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-purple-300'
        }`}
      >
        <Icon size={17} strokeWidth={2} />
      </button>
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <BookOpen size={32} className="mx-auto mb-3 text-text-muted" />

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
    <div className="relative min-h-full overflow-hidden">
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

        {/* Section heading */}
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

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70">
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
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 text-center shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70">
            <Search size={28} className="mx-auto mb-3 text-[#62529D]" />

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
                  className="group relative isolate flex min-h-[210px] flex-col overflow-hidden rounded-[22px] border border-[#E8D8FF] bg-white/85 shadow-[0_4px_12px_rgba(91,55,150,0.09)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#CDA8FF] hover:shadow-[0_12px_28px_rgba(91,55,150,0.15)] dark:border-slate-700 dark:bg-slate-900/85"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1 -right-1 z-0 h-[82%] w-[48%] bg-contain bg-right-bottom bg-no-repeat opacity-80 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${noteFlower})`,
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-white via-white/95 to-white/10 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/30"
                  />

                  <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">
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

                    <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-[#10123D] dark:text-slate-100">
                      {entry.title || 'Untitled entry'}
                    </h3>

                    <p className="mb-4 line-clamp-3 max-w-[90%] text-sm leading-relaxed text-[#51418F] dark:text-slate-300">
                      {excerptFromContent(entry.content) ||
                        'A personal moment captured in your journal.'}
                    </p>

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

      {/* Journal Editor */}
      <Dialog
        open={!!editing}
        onClose={() => {
          if (!isSaving) closeEditor();
        }}
        title={editing === 'new' ? 'Create journal entry' : 'Edit journal entry'}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <span className="hidden text-xs text-[#8B7BAF] sm:block dark:text-slate-500">
              Your thoughts, your private space.
            </span>

            <div className="ml-auto flex items-center gap-2">
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
            </div>
          </div>
        }
      >
        <div className="space-y-5">

          {/* Editor introduction */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#E9DFFF] bg-gradient-to-r from-[#F8F3FF]/90 to-[#FFF5FA]/90 p-4 dark:border-purple-900/50 dark:from-purple-950/30 dark:to-pink-950/20">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-[#8056C7] shadow-sm dark:bg-slate-800 dark:text-purple-300">
              <PenLine size={19} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-[#38265F] dark:text-slate-100">
                A little space for your thoughts
              </p>

              <p className="mt-0.5 text-xs text-[#806EAA] dark:text-slate-400">
                Write freely. Every little moment matters.
              </p>
            </div>

            <Sparkles
              size={19}
              className="ml-auto shrink-0 text-[#B18AE8]"
            />
          </div>

          {/* Title */}
          <Field label="Entry title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your day a title..."
              maxLength={150}
              className="h-12 rounded-xl border-[#E5D8F7] bg-white/80 text-base font-semibold dark:border-slate-700 dark:bg-slate-900/80"
            />
          </Field>

          {/* Mood and Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="How are you feeling?">
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

            <Field label="Entry date">
              <Input
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                className="h-11 rounded-xl border-[#E5D8F7] bg-white/80 dark:border-slate-700 dark:bg-slate-900/80"
              />
            </Field>
          </div>

          {/* Writing editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-[#49366F] dark:text-slate-200">
                Your thoughts
              </label>

              <span className="text-xs text-[#9A88BC] dark:text-slate-500">
                Rich text editor
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E4D7F5] bg-white/90 shadow-[0_4px_16px_rgba(91,55,150,0.06)] transition-colors focus-within:border-[#B99AE8] focus-within:shadow-[0_0_0_3px_rgba(185,154,232,0.13)] dark:border-slate-700 dark:bg-slate-900/90">

              {/* Formatting toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#EDE5F7] bg-[#FAF7FF]/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">

                <div className="flex items-center gap-1">
                  {toolbarButton(
                    'Bold',
                    Bold,
                    () => editor?.chain().focus().toggleBold().run(),
                    editor?.isActive('bold')
                  )}

                  {toolbarButton(
                    'Italic',
                    Italic,
                    () => editor?.chain().focus().toggleItalic().run(),
                    editor?.isActive('italic')
                  )}

                  {toolbarButton(
                    'Strikethrough',
                    Strikethrough,
                    () => editor?.chain().focus().toggleStrike().run(),
                    editor?.isActive('strike')
                  )}
                </div>

                <div className="mx-1 h-6 w-px bg-[#E3D8F1] dark:bg-slate-700" />

                <div className="flex items-center gap-1">
                  {toolbarButton(
                    'Paragraph',
                    AlignLeft,
                    () => editor?.chain().focus().setParagraph().run(),
                    editor?.isActive('paragraph')
                  )}

                  {toolbarButton(
                    'Heading 2',
                    Heading2,
                    () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                    editor?.isActive('heading', { level: 2 })
                  )}

                  {toolbarButton(
                    'Heading 3',
                    Heading3,
                    () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                    editor?.isActive('heading', { level: 3 })
                  )}
                </div>

                <div className="mx-1 h-6 w-px bg-[#E3D8F1] dark:bg-slate-700" />

                <div className="flex items-center gap-1">
                  {toolbarButton(
                    'Bullet list',
                    List,
                    () => editor?.chain().focus().toggleBulletList().run(),
                    editor?.isActive('bulletList')
                  )}

                  {toolbarButton(
                    'Numbered list',
                    ListOrdered,
                    () => editor?.chain().focus().toggleOrderedList().run(),
                    editor?.isActive('orderedList')
                  )}

                  {toolbarButton(
                    'Blockquote',
                    Quote,
                    () => editor?.chain().focus().toggleBlockquote().run(),
                    editor?.isActive('blockquote')
                  )}

                  {toolbarButton(
                    'Code block',
                    Code,
                    () => editor?.chain().focus().toggleCodeBlock().run(),
                    editor?.isActive('codeBlock')
                  )}
                </div>

                <div className="mx-1 h-6 w-px bg-[#E3D8F1] dark:bg-slate-700" />

                <div className="flex items-center gap-1">
                  {toolbarButton(
                    'Horizontal divider',
                    Minus,
                    () => editor?.chain().focus().setHorizontalRule().run()
                  )}

                  {toolbarButton(
                    'Undo',
                    Undo2,
                    () => editor?.chain().focus().undo().run(),
                    false,
                    !editor?.can().undo()
                  )}

                  {toolbarButton(
                    'Redo',
                    Redo2,
                    () => editor?.chain().focus().redo().run(),
                    false,
                    !editor?.can().redo()
                  )}
                </div>
              </div>

              {/* Editor content */}
              <div className="max-h-[420px] min-h-[300px] overflow-y-auto">
                <EditorContent editor={editor} />
              </div>

              {/* Editor footer */}
              <div className="flex items-center justify-between border-t border-[#EDE5F7] bg-[#FCFAFF]/90 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/70">
                <span className="text-xs text-[#9584B5] dark:text-slate-500">
                  Start writing whenever you're ready.
                </span>

                <span className="flex items-center gap-1.5 text-xs text-[#9584B5] dark:text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Editor ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <style>{`
        .journal-prose {
          font-size: 15px;
          line-height: 1.85;
          overflow-wrap: anywhere;
        }

        .journal-prose p {
          margin: 0 0 12px;
        }

        .journal-prose h2 {
          margin: 20px 0 10px;
          font-size: 1.45rem;
          line-height: 1.35;
          font-weight: 700;
          color: #49366F;
        }

        .journal-prose h3 {
          margin: 18px 0 8px;
          font-size: 1.2rem;
          line-height: 1.4;
          font-weight: 700;
          color: #624B8F;
        }

        .dark .journal-prose h2,
        .dark .journal-prose h3 {
          color: #D8C5FA;
        }

        .journal-prose ul,
        .journal-prose ol {
          margin: 10px 0;
          padding-left: 26px;
        }

        .journal-prose ul {
          list-style: disc;
        }

        .journal-prose ol {
          list-style: decimal;
        }

        .journal-prose li {
          padding-left: 4px;
          margin: 4px 0;
        }

        .journal-prose blockquote {
          margin: 16px 0;
          padding: 10px 16px;
          border-left: 3px solid #B99AE8;
          border-radius: 0 10px 10px 0;
          background: rgba(185, 154, 232, 0.10);
          color: #75618F;
        }

        .dark .journal-prose blockquote {
          color: #C4B5D9;
          background: rgba(168, 135, 220, 0.10);
        }

        .journal-prose pre {
          margin: 14px 0;
          padding: 14px;
          overflow-x: auto;
          border-radius: 12px;
          background: #F3EFF9;
          color: #49366F;
          font-size: 13px;
        }

        .dark .journal-prose pre {
          background: #171827;
          color: #DDD0F4;
        }

        .journal-prose code {
          padding: 2px 5px;
          border-radius: 5px;
          background: rgba(185, 154, 232, 0.16);
          font-size: 0.9em;
        }

        .journal-prose pre code {
          padding: 0;
          background: transparent;
        }

        .journal-prose hr {
          margin: 20px 0;
          border: 0;
          border-top: 1px solid #E5D8F5;
        }

        .dark .journal-prose hr {
          border-color: #3B354B;
        }

        .journal-prose p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          color: #AA9ABF;
          pointer-events: none;
        }

        .dark .journal-prose p.is-editor-empty:first-child::before {
          color: #77718A;
        }

        .journal-prose > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
