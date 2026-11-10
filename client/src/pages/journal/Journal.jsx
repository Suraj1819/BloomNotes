
import { useEffect, useMemo, useState } from 'react';
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
  LayoutGrid,
  Archive,
  ArchiveRestore,
  ArrowDownUp,
  RefreshCw,
  FileText,
  SearchX,
  FolderOpen,
} from 'lucide-react';

import { excerptFromContent } from '../../lib/utils.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import noteCardBackground from '../../../assets/background/notecard.png';
import lavenderBackground from '../../../assets/background/fav4.png';

const glass = 'bn-glass-card';

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
  const [sort, setSort] = useState('updated');
  const [previewEntry, setPreviewEntry] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(6);

  const {
    data,
    isLoading,
    isError,
    isFetching,
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
          'ProseMirror journal-prose min-h-[280px] px-5 py-5 sm:px-7 sm:py-6 outline-none text-[#8D596B] dark:text-slate-200',
      },
    },
  });

  const previewEditor = useEditor({
    extensions: [StarterKit],
    editable: false,
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'ProseMirror journal-prose min-h-[180px] px-5 py-5 sm:px-7 sm:py-6 outline-none text-text-main dark:text-slate-200',
      },
    },
  });

  const openPreview = (entry) => {
    setPreviewEntry(entry);
    previewEditor?.commands.setContent(
      entry?.content || { type: 'doc', content: [{ type: 'paragraph' }] }
    );
  };

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

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = entries.filter((entry) => {
      if (!query) return true;
      return (
        String(entry.title || '').toLowerCase().includes(query) ||
        String(entry.mood || '').toLowerCase().includes(query) ||
        String(entry.entry_date || '').toLowerCase().includes(query) ||
        String(excerptFromContent(entry.content) || '').toLowerCase().includes(query)
      );
    });
    return [...matched].sort((a, b) => {
      if (sort === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
      const aDate = new Date(a.entry_date || a.created_at || 0).getTime();
      const bDate = new Date(b.entry_date || b.created_at || 0).getTime();
      return sort === 'oldest' ? aDate - bDate : bDate - aDate;
    });
  }, [entries, search, sort]);

  useEffect(() => { setVisibleCount(6); }, [search, sort]);

  const isSaving = create.isPending || update.isPending;
  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasSearch = Boolean(search.trim());

  const handleSearchChange = (value) => {
    setSearch(value);
    setVisibleCount(6);
  };

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
            ? 'bg-[#F8E8EC] text-[#B85C78] shadow-sm dark:bg-rose-500/20 dark:text-rose-300'
            : 'text-[#987D86] hover:bg-[#FBEFF2] hover:text-[#B85C78] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-300'
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
    <div
      className="journal-page relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${lavenderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay — identical to Archive */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80" />

      <main className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
        {/* Header — same Archive structure */}
        <header className="mb-7 sm:mb-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
                <BookOpen size={25} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">My Journal</h1>
                  <span className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted backdrop-blur-xl">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-muted">Your personal space for thoughts, moods and everyday moments.</p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button variant="outline" onClick={() => refetch()} loading={isFetching} disabled={isFetching} className="shrink-0" title="Refresh journal">
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button onClick={() => openEditor('new')} className="flex-1 justify-center sm:flex-none">
                <Plus size={16} /> New Entry
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <BookOpen size={14} className="text-accent/70" />
            <div className="h-px flex-1 bg-border/60" />
          </div>
        </header>

        {/* Search and sorting — same Archive glass panel */}
        <section className={`${glass} mb-7 rounded-3xl p-3.5 sm:p-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search journal entries by title, mood or content..."
                aria-label="Search journal entries"
                className="h-12 w-full rounded-2xl border border-border/70 bg-input/60 pl-11 pr-10 text-sm text-text-main outline-none backdrop-blur-xl transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              {search && (
                <button type="button" onClick={() => handleSearchChange('')} aria-label="Clear search" className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent/10 hover:text-accent">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 sm:w-auto">
              <span className="hidden items-center gap-1.5 text-xs font-medium text-text-muted sm:flex"><ArrowDownUp size={14} />Sort</span>
              <Select value={sort} onChange={(event) => setSort(event.target.value)} className="h-12 w-full sm:w-48">
                <option value="updated">Recently added</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title (A-Z)</option>
              </Select>
            </div>
          </div>
          {hasSearch && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
              <p className="text-xs text-text-muted">Showing {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} for <strong className="text-text-main">"{search}"</strong></p>
              <button type="button" onClick={() => handleSearchChange('')} className="text-xs font-semibold text-accent hover:underline">Clear search</button>
            </div>
          )}
        </section>

        {/* Collection toolbar — same Archive placement */}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ArchiveRestore size={17} className="text-accent" />
              <h2 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">Journal Collection</h2>
            </div>
            <p className="mt-1 text-xs text-text-muted sm:text-sm">Your collection of personal thoughts and daily moments.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/55 p-1 backdrop-blur-xl">
              <button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode === 'grid'} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${viewMode === 'grid' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:bg-accent/10 hover:text-accent'}`}><LayoutGrid size={17} /></button>
              <button type="button" onClick={() => setViewMode('list')} aria-label="List view" aria-pressed={viewMode === 'list'} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${viewMode === 'list' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:bg-accent/10 hover:text-accent'}`}><List size={18} /></button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-3 py-2 text-xs font-medium text-text-muted backdrop-blur-xl"><FileText size={14} />{filteredEntries.length} results</div>
          </div>
        </section>

        {/* Journal collection */}
        {filteredEntries.length === 0 ? (
          hasSearch ? (
            <div className={`${glass} rounded-3xl px-5 py-14 text-center sm:py-16`}>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent"><SearchX size={27} strokeWidth={1.8} /></div>
              <h3 className="text-lg font-semibold text-text-main">No matching journal entries</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">Try another keyword to find the entry you are looking for.</p>
              <Button variant="outline" className="mt-6" onClick={() => handleSearchChange('')}><RefreshCw size={15} />Clear search</Button>
            </div>
          ) : (
            <EmptyState icon={FolderOpen} title="Your journal is empty" description="Your journal entries will appear here. Create your first entry to capture a thought or moment." action={<Button onClick={() => openEditor('new')}><Plus size={15} />New Entry</Button>} />
          )
        ) : (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3' : 'flex flex-col gap-4'}>
              {visibleEntries.map((entry) => {
                const moodMeta = MOODS.find((item) => item.id === entry.mood);
                return (
                  <article
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openPreview(entry)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPreview(entry); } }}
                    className={`journal-entry-card group relative isolate flex min-h-[285px] cursor-pointer flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/70 shadow-[0_4px_16px_rgba(50,35,90,0.07)] backdrop-blur-xl transition-all duration-300 hover:border-accent/40 hover:shadow-[0_8px_22px_rgba(50,35,90,0.10)] ${viewMode === 'list' ? 'w-full' : ''}`}
                  >
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[22px]">
                      <img src={noteCardBackground} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.62] dark:opacity-[0.22]" />
                      <div className="absolute inset-0 bg-white/35 dark:hidden" />
                      <div className="absolute inset-0 hidden bg-slate-950/65 dark:block" />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-accent/10" />
                    </div>
                    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-[22%] z-10 h-[56%] w-[4px] rounded-r-full bg-accent" />
                    <div aria-hidden="true" className="pointer-events-none absolute -right-3 -top-3 z-0 h-36 w-36 rounded-full bg-accent/20 blur-3xl" />
                    <div className="relative z-10 flex flex-1 flex-col p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="mb-6 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-2xl shadow-sm backdrop-blur-lg">{moodMeta?.emoji || '📝'}</div>
                          <div className="min-w-0"><p className="text-xs font-semibold text-text-muted">JOURNAL ENTRY</p><p className="mt-0.5 text-xs text-text-muted">{formatDate(entry.entry_date)}</p></div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button type="button" onClick={(event) => { event.stopPropagation(); openEditor(entry); }} aria-label="Edit entry" title="Edit" className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-accent/10 hover:text-accent"><Pencil size={16} /></button>
                          <button type="button" disabled={remove.isPending} onClick={(event) => { event.stopPropagation(); handleRemove(entry); }} aria-label="Delete entry" title="Delete" className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h3 className="mb-3 line-clamp-2 text-[21px] font-bold leading-snug tracking-tight text-text-main">{entry.title || 'Untitled entry'}</h3>
                      <p className="mb-5 line-clamp-4 max-w-[95%] text-[13px] leading-[1.85] text-text-muted">{excerptFromContent(entry.content) || 'No description added yet.'}</p>
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-4">
                        <span className="text-xs font-medium text-text-muted">Click to read full entry</span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: moodMeta?.color || '#64748B', backgroundColor: `${moodMeta?.color || '#64748B'}15` }}>{moodMeta?.emoji || '📝'} {moodMeta?.label || 'No mood'}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {filteredEntries.length > visibleCount && (
              <div className="mt-7 flex justify-center"><Button variant="outline" onClick={() => setVisibleCount((count) => count + 6)}><FileText size={15} />Show more ({Math.min(6, filteredEntries.length - visibleCount)})</Button></div>
            )}
            {visibleCount > 6 && filteredEntries.length > 6 && (
              <div className="mt-3 flex justify-center"><button type="button" onClick={() => setVisibleCount(6)} className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted transition hover:bg-accent/10 hover:text-accent">Show less</button></div>
            )}
          </>
        )}

        {filteredEntries.length > 0 && (
          <footer className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-border/50 pt-5 text-center text-xs text-text-muted"><BookOpen size={14} className="text-accent" /><span>Your journal entries are saved in your personal collection.</span></footer>
        )}
      </main>

      {/* Full journal preview */}
      <Dialog
        open={!!previewEntry}
        onClose={() => setPreviewEntry(null)}
        title="Journal preview"
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => setPreviewEntry(null)}>Close</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { const entry = previewEntry; setPreviewEntry(null); openEditor(entry); }}>
                <Pencil size={15} /> Edit entry
              </Button>
              <Button onClick={() => { const entry = previewEntry; setPreviewEntry(null); if (entry) handleRemove(entry); }}>
                <Trash2 size={15} /> Delete
              </Button>
            </div>
          </div>
        }
      >
        {previewEntry && (() => {
          const previewMood = MOODS.find((item) => item.id === previewEntry.mood);
          return (
            <div className="relative isolate overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl dark:border-[#60404B] dark:bg-[#281B22]/98">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl"
              >
                <img
                  src={noteCardBackground}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.48] dark:opacity-[0.18]"
                />
                <div className="absolute inset-0 bg-white/45 dark:hidden" />
                <div className="absolute inset-0 hidden bg-[#281B22]/75 dark:block" />
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute -right-3 -top-3 z-[1] h-36 w-36 rounded-full bg-accent/15 blur-3xl" />
              <div className="relative z-10 p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <div className="flex items-center gap-2 text-sm text-text-muted"><CalendarDays size={15} />{formatDate(previewEntry.entry_date)}</div>
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ color: previewMood?.color || '#64748B', backgroundColor: `${previewMood?.color || '#64748B'}15` }}>
                    {previewMood?.emoji || '📝'} {previewMood?.label || 'No mood'}
                  </span>
                </div>
                <h2 className="mb-5 text-2xl font-bold tracking-tight text-text-main sm:text-3xl">{previewEntry.title || 'Untitled entry'}</h2>
                <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border/40 bg-surface/40">
                  <EditorContent editor={previewEditor} />
                </div>
              </div>
            </div>
          );
        })()}
      </Dialog>

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
            <span className="hidden text-xs text-[#A58B93] sm:block dark:text-slate-500">
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
          <div className="flex items-center gap-3 rounded-2xl border border-[#F3DDE3] bg-gradient-to-r from-[#FFF5F6]/90 to-[#FDF0F3]/90 p-4 dark:border-rose-900/40 dark:from-[#2B1B22]/90 dark:to-[#302029]/90">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-[#B85C78] shadow-sm dark:bg-[#30212A] dark:text-rose-300">
              <PenLine size={19} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-[#56313F] dark:text-slate-100">
                A little space for your thoughts
              </p>

              <p className="mt-0.5 text-xs text-[#9B7883] dark:text-slate-400">
                Write freely. Every little moment matters.
              </p>
            </div>

            <Sparkles
              size={19}
              className="ml-auto shrink-0 text-[#D58A9D]"
            />
          </div>

          {/* Title */}
          <Field label="Entry title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your day a title..."
              maxLength={150}
              className="h-12 rounded-xl border-[#EBD3DA] bg-white/80 text-base font-semibold dark:border-[#60404B] dark:bg-[#21171D]"
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
                className="h-11 rounded-xl border-[#EBD3DA] bg-white/80 dark:border-[#60404B] dark:bg-[#21171D]"
              />
            </Field>
          </div>

          {/* Writing editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-[#56313F] dark:text-slate-200">
                Your thoughts
              </label>

              <span className="text-xs text-[#A98B96] dark:text-slate-500">
                Rich text editor
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#EBD3DA] bg-white/90 shadow-[0_4px_16px_rgba(142,63,87,0.06)] transition-colors focus-within:border-[#C77C93] focus-within:shadow-[0_0_0_3px_rgba(184,92,120,0.13)] dark:border-[#60404B] dark:bg-[#21171D]">

              {/* Formatting toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b border-[#F1DFE4] bg-[#FFF7F8]/90 px-3 py-2 dark:border-[#60404B] dark:bg-[#30212A]">

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

                <div className="mx-1 h-6 w-px bg-[#EBD3DA] dark:bg-[#60404B]" />

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

                <div className="mx-1 h-6 w-px bg-[#EBD3DA] dark:bg-[#60404B]" />

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

                <div className="mx-1 h-6 w-px bg-[#EBD3DA] dark:bg-[#60404B]" />

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
              <div className="flex items-center justify-between border-t border-[#F1DFE4] bg-[#FFFAFB]/90 px-4 py-2.5 dark:border-[#60404B] dark:bg-[#30212A]">
                <span className="text-xs text-[#A98B96] dark:text-slate-500">
                  Start writing whenever you're ready.
                </span>

                <span className="flex items-center gap-1.5 text-xs text-[#A98B96] dark:text-slate-500">
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
          color: #56313F;
        }

        .journal-prose h3 {
          margin: 18px 0 8px;
          font-size: 1.2rem;
          line-height: 1.4;
          font-weight: 700;
          color: #875467;
        }

        .dark .journal-prose {
          color: #F3E5EA;
          caret-color: #E5A0B2;
        }

        .dark .journal-prose h2,
        .dark .journal-prose h3 {
          color: #F0B9C8;
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
          border-left: 3px solid #C77C93;
          border-radius: 0 10px 10px 0;
          background: rgba(184, 92, 120, 0.10);
          color: #A77D8B;
        }

        .dark .journal-prose blockquote {
          color: #D8B9C3;
          background: rgba(184, 92, 120, 0.12);
        }

        .journal-prose pre {
          margin: 14px 0;
          padding: 14px;
          overflow-x: auto;
          border-radius: 12px;
          background: #33232A;
          color: #56313F;
          font-size: 13px;
        }

        .dark .journal-prose pre {
          background: #21171D;
          color: #F5E9ED;
        }

        .journal-prose code {
          padding: 2px 5px;
          border-radius: 5px;
          background: rgba(184, 92, 120, 0.16);
          font-size: 0.9em;
        }

        .journal-prose pre code {
          padding: 0;
          background: transparent;
        }

        .journal-prose hr {
          margin: 20px 0;
          border: 0;
          border-top: 1px solid #EBD3DA;
        }

        .dark .journal-prose hr {
          border-color: #4A303A;
        }

        .journal-prose p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          color: #B69BA3;
          pointer-events: none;
        }

        .dark .journal-prose p.is-editor-empty:first-child::before {
          color: #A98B96;
        }

        .journal-prose > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
