
import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

import { FontSize } from '../../components/editor/extensions/FontSize.js';
import { ResizableImage } from '../../components/editor/extensions/ResizableImage.js';
import { ShapeExtension } from '../../components/editor/extensions/ShapeExtension.js';
import { EditorToolbar } from '../../components/editor/EditorToolbar.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { personalSpaceApi } from '../../services/index.js';

import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { PageLoader, EmptyState } from '../../components/ui/Spinner.jsx';

import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Pin,
  Link as LinkIcon,
  ListChecks,
  FileText,
  Code,
  Clock3,
  Search,
  LayoutGrid,
  List,
  X,
  RefreshCw,
  ArrowDownUp,
  SearchX,
  Save,
  ArrowLeft,
  Type,
  FolderOpen,
  CheckCircle2,
  PanelTop,
} from 'lucide-react';

import { relativeTime, cn } from '../../lib/utils.js';
import { useConfirm, usePrompt } from '../../contexts/ConfirmContext.jsx';

import lavenderBg from '../../../assets/background/fav4.png';
import noteCardBackground from '../../../assets/background/notecard.png';

const KIND_META = {
  note: { label: 'Note', icon: FileText },
  checklist: { label: 'Checklist', icon: ListChecks },
  link: { label: 'Link', icon: LinkIcon },
  snippet: { label: 'Snippet', icon: Code },
};

function RichEntryEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your content...' }),
      CharacterCount,
      FontFamily,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      FontSize,
      ResizableImage,
      ShapeExtension,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'personal-space-editor-content focus:outline-none',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white/80 shadow-inner dark:border-white/10 dark:bg-slate-950/50">
      <div className="sticky top-0 z-10 border-b border-rose-100/80 bg-white/95 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
        {editor && <EditorToolbar editor={editor} />}
      </div>
      <div className="min-h-[360px] max-h-[calc(100vh-350px)] overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <EditorContent editor={editor} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rose-100/70 px-4 py-2 text-[11px] text-slate-400 dark:border-white/10">
        <span>Rich text editor · Formatting is saved with your entry</span>
        <span>{editor?.storage.characterCount?.words?.() ?? 0} words</span>
      </div>
    </div>
  );
}

function sanitizeEntryHtml(value = '') {
  return String(value)
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\s on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*(javascript:|data:text\/html)[\s\S]*?\2/gi, '$1="#"');
}

function EntryPreview({ entry, onClose, onEdit }) {
  if (!entry) return null;
  const Meta = KIND_META[entry.kind] || KIND_META.note;
  const KindIcon = Meta.icon;
  const content = entry.content || '';

  return (
    <Dialog open={!!entry} onClose={onClose} title="Entry details" size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/80 px-3 py-1.5 text-xs font-bold text-[#B85C78] dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
            <KindIcon size={14} /> {Meta.label}
          </span>
          {entry.is_pinned && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <Pin size={13} fill="currentColor" /> Pinned
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Clock3 size={13} /> Updated {relativeTime(entry.updated_at)}
          </span>
        </div>

        <div className="rounded-2xl border border-rose-100/80 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
          <h2 className="mb-4 break-words text-2xl font-extrabold leading-tight text-[#38242D] dark:text-white">
            {entry.title || 'Untitled'}
          </h2>
          <div
            className="personal-space-preview-content min-h-[120px] break-words text-sm leading-7 text-slate-700 dark:text-slate-200"
            dangerouslySetInnerHTML={{
              __html: sanitizeEntryHtml(content || '<p>No additional content</p>'),
            }}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}><Pencil size={14} /> Edit entry</Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function PersonalSpace() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const { data: cats } = useQuery({
    queryKey: ['ps-cats'],
    queryFn: () => personalSpaceApi.listCategories(),
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['ps-entries'],
    queryFn: () => personalSpaceApi.listEntries({ limit: 200 }),
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated');
  const [visibleCount, setVisibleCount] = useState(6);

  const [form, setForm] = useState({
    kind: 'note',
    title: '',
    content: '',
    category_id: '',
    is_pinned: false,
  });

  const close = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm({
      kind: 'note',
      title: '',
      content: '',
      category_id: '',
      is_pinned: false,
    });
  };

  const create = useMutation({
    mutationFn: (body) => personalSpaceApi.createEntry(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      close();
      toast.success('Created');
    },
    onError: (error) => toast.error(error.message || 'Could not create entry'),
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => personalSpaceApi.updateEntry(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      close();
      toast.success('Updated');
    },
    onError: (error) => toast.error(error.message || 'Could not update entry'),
  });

  const remove = useMutation({
    mutationFn: (id) => personalSpaceApi.removeEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      toast.success('Deleted');
    },
    onError: (error) => toast.error(error.message || 'Could not delete entry'),
  });

  const pin = useMutation({
    mutationFn: ({ id, val }) =>
      personalSpaceApi.updateEntry(id, { is_pinned: val }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      toast.success(variables.val ? 'Entry pinned' : 'Entry unpinned');
    },
    onError: (error) => toast.error(error.message || 'Could not update pin'),
  });

  const createCat = useMutation({
    mutationFn: (body) => personalSpaceApi.createCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-cats'] });
      toast.success('Category created');
    },
    onError: (error) => toast.error(error.message || 'Could not create category'),
  });

  const handleRemove = async (entry) => {
    const ok = await confirm({
      title: 'Delete entry?',
      description: `"${entry.title || entry.kind}" will be permanently deleted.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (ok) remove.mutate(entry.id);
  };

  const handleNewCategory = async () => {
    const name = await prompt({
      title: 'New category',
      description: 'Give your new personal-space category a name.',
      placeholder: 'e.g. Recipes',
      confirmText: 'Create',
    });

    if (name) createCat.mutate({ name });
  };

  const open = (entry) => {
    if (entry) {
      setEditing(entry);
      setForm({
        kind: entry.kind,
        title: entry.title || '',
        content: entry.content || '',
        category_id: entry.category_id || '',
        is_pinned: entry.is_pinned,
      });
    } else {
      setEditing(null);
      setForm({
        kind: 'note',
        title: '',
        content: '',
        category_id: '',
        is_pinned: false,
      });
    }

    setEditorOpen(true);
  };

  const save = () => {
    const body = {
      ...form,
      category_id: form.category_id || null,
    };

    if (editing) {
      update.mutate({ id: editing.id, body });
    } else {
      create.mutate(body);
    }
  };

  useEffect(() => {
    setVisibleCount(6);
  }, [search, sort]);

  if (isLoading) return <PageLoader />;

  const entries = data?.items || [];
  const isSaving = create.isPending || update.isPending;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredEntries = entries
    .filter((entry) => {
      if (!normalizedSearch) return true;
      return [entry.title, entry.content, entry.kind]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (sort === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''));
      }
      const aDate = new Date(sort === 'created' ? a.created_at || a.updated_at : a.updated_at || a.created_at).getTime();
      const bDate = new Date(sort === 'created' ? b.created_at || b.updated_at : b.updated_at || b.created_at).getTime();
      return (bDate || 0) - (aDate || 0);
    });
  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasSearch = Boolean(normalizedSearch);

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80" />
      <style>{`
        .personal-space-editor-content { min-height: 260px; outline: none; }
        .personal-space-editor-content p { margin: 0.55rem 0; line-height: 1.8; }
        .personal-space-editor-content h1 { margin: 1.1rem 0 0.6rem; font-size: 1.7rem; font-weight: 800; line-height: 1.2; }
        .personal-space-editor-content h2 { margin: 1rem 0 0.55rem; font-size: 1.35rem; font-weight: 750; line-height: 1.3; }
        .personal-space-editor-content h3 { margin: 0.9rem 0 0.5rem; font-size: 1.12rem; font-weight: 700; }
        .personal-space-editor-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-editor-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-editor-content blockquote { border-left: 3px solid #C77C93; margin: 1rem 0; padding: 0.25rem 0 0.25rem 1rem; color: #9A7883; }
        .personal-space-editor-content a, .personal-space-preview-content a { color: #B85C78; text-decoration: underline; }
        .personal-space-editor-content table, .personal-space-preview-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .personal-space-editor-content th, .personal-space-editor-content td, .personal-space-preview-content th, .personal-space-preview-content td { border: 1px solid #E8CDD4; padding: 0.5rem; text-align: left; }
        .personal-space-editor-content th, .personal-space-preview-content th { background: rgba(184, 92, 120, 0.08); font-weight: 700; }
        .personal-space-editor-content mark, .personal-space-preview-content mark { border-radius: 0.2rem; padding: 0 0.12rem; }
        .personal-space-editor-content p.is-editor-empty:first-child::before { color: #B69BA3; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .personal-space-preview-content p { margin: 0.6rem 0; white-space: pre-wrap; }
        .personal-space-preview-content h1, .personal-space-preview-content h2, .personal-space-preview-content h3 { margin: 1rem 0 0.55rem; font-weight: 800; line-height: 1.3; }
        .personal-space-preview-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-preview-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-preview-content blockquote { border-left: 3px solid #C77C93; margin: 1rem 0; padding-left: 1rem; }
        .dark .personal-space-editor-content th, .dark .personal-space-editor-content td, .dark .personal-space-preview-content th, .dark .personal-space-preview-content td { border-color: rgba(255,255,255,.16); }
      `}</style>

      <main className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
        {/* Header — same structure as Archive */}
        <header className="mb-7 sm:mb-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
                <Sparkles size={25} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">Personal Space</h1>
                  <span className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted backdrop-blur-xl">
                    {entries.length} entries
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  Your notes, links, checklists and snippets in one place.
                </p>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                variant="outline"
                onClick={() => refetch()}
                loading={isFetching}
                disabled={isFetching}
                className="shrink-0"
                title="Refresh personal space"
              >
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button onClick={() => open()} className="flex-1 justify-center sm:flex-none">
                <Plus size={16} />
                New Entry
              </Button>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <Sparkles size={14} className="text-accent/70" />
            <div className="h-px flex-1 bg-border/60" />
          </div>
        </header>

        {/* Search panel — identical Archive styling */}
        <section className="bn-glass-card mb-7 rounded-3xl p-3.5 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search personal entries by title or content..."
                aria-label="Search personal entries"
                className="h-12 w-full rounded-2xl border border-border/70 bg-input/60 pl-11 pr-10 text-sm text-text-main outline-none backdrop-blur-xl transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent/10 hover:text-accent"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 sm:w-auto">
              <span className="hidden items-center gap-1.5 text-xs font-medium text-text-muted sm:flex">
                <ArrowDownUp size={14} /> Sort
              </span>
              <Select value={sort} onChange={(event) => setSort(event.target.value)} className="h-12 w-full sm:w-48">
                <option value="updated">Recently updated</option>
                <option value="created">Recently created</option>
                <option value="title">Title (A-Z)</option>
              </Select>
            </div>
          </div>
          {hasSearch && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
              <p className="text-xs text-text-muted">
                Showing {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} for <strong className="text-text-main">"{search}"</strong>
              </p>
              <button type="button" onClick={() => setSearch('')} className="text-xs font-semibold text-accent hover:underline">
                Clear search
              </button>
            </div>
          )}
        </section>

        {/* Collection toolbar — same Archive alignment */}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen size={17} className="text-accent" />
              <h2 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">Your Personal Collection</h2>
            </div>
            <p className="mt-1 text-xs text-text-muted sm:text-sm">
              Keep your notes, useful links, checklists and code snippets organized.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/55 p-1 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition', viewMode === 'grid' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:bg-accent/10 hover:text-accent')}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition', viewMode === 'list' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:bg-accent/10 hover:text-accent')}
              >
                <List size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-3 py-2 text-xs font-medium text-text-muted backdrop-blur-xl">
              <FileText size={14} />
              {filteredEntries.length} results
            </div>
          </div>
        </section>

        {/* Personal entries */}
        {entries.length === 0 ? (
          <div className="bn-glass-card rounded-3xl px-5 py-12">
            <EmptyState
              icon={Sparkles}
              title="Your personal space is empty"
              description="Create your first note, save a useful link, build a checklist or keep a code snippet here."
              action={
                <Button onClick={() => open()}>
                  <Plus size={14} />
                  Create first entry
                </Button>
              }
            />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bn-glass-card rounded-3xl px-5 py-14 text-center sm:py-16">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <SearchX size={27} strokeWidth={1.8} />
            </div>
            <h3 className="text-lg font-semibold text-text-main">No matching entries</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">Try another keyword to find the entry you are looking for.</p>
            <Button variant="outline" className="mt-6" onClick={() => setSearch('')}>
              <RefreshCw size={15} /> Clear search
            </Button>
          </div>
        ) : (
          <>
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3'
                : 'flex flex-col gap-4'
            )}>
              {visibleEntries.map((entry) => {
                const Meta = KIND_META[entry.kind] || KIND_META.note;
                const KindIcon = Meta.icon;
                const isPinning = pin.isPending && pin.variables?.id === entry.id;
                const isDeleting = remove.isPending && remove.variables === entry.id;

                return (
                  <article
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPreviewEntry(entry)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setPreviewEntry(entry);
                      }
                    }}
                    aria-label={`Open ${entry.title || 'untitled'} entry`}
                    className={cn(
                      'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2',
                      'group relative isolate flex min-h-[285px] min-w-0 flex-col overflow-hidden rounded-[22px]',
                      'border border-white/70 bg-white/70 shadow-[0_4px_18px_rgba(142,63,87,0.07)] backdrop-blur-xl',
                      'transition-[border-color,box-shadow] duration-200 hover:border-[#DFA9B6] hover:shadow-[0_10px_28px_rgba(142,63,87,0.12)]',
                      'dark:border-white/10 dark:bg-slate-900/65',
                      viewMode === 'list' && 'min-h-0 sm:flex-row'
                    )}
                  >
                    {/* NoteCard-style accent stripe */}
                    <div className="pointer-events-none absolute bottom-[22%] left-0 top-[22%] z-20 w-1 rounded-r-full bg-gradient-to-b from-[#D79AAA] via-[#B85C78] to-[#E8B9C4]" />

                    {/* Full-card notecard1 artwork */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[22px]"
                    >
                      <img
                        src={noteCardBackground}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.62] dark:opacity-[0.22]"
                      />
                      <div className="absolute inset-0 bg-white/35 dark:hidden" />
                      <div className="absolute inset-0 hidden bg-slate-900/65 dark:block" />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-rose-100/15 dark:from-rose-950/10 dark:via-transparent dark:to-black/10" />
                    </div>
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 z-0 h-36 w-36 rounded-full bg-rose-300/15 blur-3xl dark:bg-rose-500/10" />

                    <div className={cn(
                      'relative z-10 flex min-w-0 flex-1 flex-col p-5 pl-6 sm:p-6 sm:pl-7',
                      viewMode === 'list' && 'sm:flex-row sm:items-stretch sm:gap-6'
                    )}>
                      <div className="flex min-w-0 flex-1 flex-col">
                        {/* Card header */}
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-white/75 text-[#B85C78] shadow-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-rose-300">
                              <KindIcon size={19} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-[#A94F6C] dark:text-rose-300">{Meta.label}</p>
                              <p className="mt-0.5 truncate text-[11px] text-[#A58B93] dark:text-slate-400">Personal collection</p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5">
                            {entry.is_pinned && (
                              <span title="Pinned" className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E8FF] text-[#B85C78] dark:bg-rose-950/60 dark:text-rose-300">
                                <Pin size={14} fill="currentColor" />
                              </span>
                            )}
                            <button
                              type="button"
                              disabled={isPinning}
                              onClick={(event) => {
                                event.stopPropagation();
                                pin.mutate({ id: entry.id, val: !entry.is_pinned });
                              }}
                              title={entry.is_pinned ? 'Unpin' : 'Pin'}
                              aria-label={entry.is_pinned ? 'Unpin entry' : 'Pin entry'}
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F1E8FF] disabled:opacity-50 dark:hover:bg-white/10',
                                entry.is_pinned ? 'text-[#B85C78]' : 'text-[#987D86] dark:text-slate-400'
                              )}
                            >
                              <Pin size={15} fill={entry.is_pinned ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                open(entry);
                              }}
                              title="Edit"
                              aria-label="Edit entry"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#987D86] transition-colors hover:bg-[#F1E8FF] hover:text-[#A94F6C] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-rose-300"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemove(entry);
                              }}
                              title="Delete"
                              aria-label="Delete entry"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#987D86] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-2 break-words text-[20px] font-bold leading-snug text-[#38242D] dark:text-slate-100">
                            {entry.title || 'Untitled'}
                          </h3>
                          <p className="line-clamp-4 min-h-[3.5rem] whitespace-pre-wrap break-words text-[13px] leading-[1.85] text-[#76505E] dark:text-slate-300">
                            {entry.content || 'No additional content'}
                          </p>
                        </div>

                        {/* Card footer */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDE2FA] pt-3 dark:border-slate-700">
                          <div className="flex min-w-0 items-center gap-2">
                            <Clock3 size={14} className="shrink-0 text-[#987D86] dark:text-slate-400" />
                            <span className="truncate text-xs font-medium text-[#8D707A] dark:text-slate-400">
                              Updated {relativeTime(entry.updated_at)}
                            </span>
                          </div>
                          <span className="shrink-0 rounded-full border border-[#E8D8FF] bg-white/75 px-2.5 py-1 text-[10px] font-semibold text-[#B85C78] dark:border-white/10 dark:bg-slate-800/80 dark:text-rose-300">
                            {Meta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredEntries.length > visibleCount && (
              <div className="mt-7 flex justify-center">
                <Button variant="outline" onClick={() => setVisibleCount((count) => count + 6)}>
                  <FileText size={15} />
                  Show more ({Math.min(6, filteredEntries.length - visibleCount)})
                </Button>
              </div>
            )}
            {visibleCount > 6 && filteredEntries.length > 6 && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(6)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted transition hover:bg-accent/10 hover:text-accent"
                >
                  Show less
                </button>
              </div>
            )}
          </>
        )}

        {/* Full-screen professional editor */}
        {editorOpen && (
          <div
            className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#F7F5FC] text-slate-800 dark:bg-[#090B14] dark:text-slate-100"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? 'Edit personal entry' : 'Create personal entry'}
          >
            {/* Editor top bar */}
            <header className="relative z-20 flex shrink-0 flex-col gap-3 border-b border-rose-100/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-white text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="Close editor"
                    title="Back to Personal Space"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-500 text-white shadow-md shadow-rose-500/20">
                    <Type size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-800 dark:text-white">
                      {editing ? 'Edit entry' : 'Create new entry'}
                    </p>
                    <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
                      Professional writing workspace
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 sm:inline-flex">
                    <CheckCircle2 size={13} />
                    Ready to save
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                  <Button onClick={save} disabled={isSaving}>
                    <Save size={15} />
                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save entry'}</span>
                    <span className="sm:hidden">{isSaving ? 'Saving' : 'Save'}</span>
                  </Button>
                </div>
              </div>
            </header>

            {/* Editor workspace */}
            <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
                {/* Entry properties */}
                <section className="rounded-2xl border border-rose-100/80 bg-white/85 p-4 shadow-[0_8px_28px_rgba(142,63,87,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <PanelTop size={16} className="text-rose-600 dark:text-rose-300" />
                    <h2 className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-600 dark:text-slate-300">
                      Entry details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Entry type">
                      <Select
                        value={form.kind}
                        onChange={(e) => setForm((current) => ({ ...current, kind: e.target.value }))}
                      >
                        {Object.entries(KIND_META).map(([id, meta]) => (
                          <option key={id} value={id}>{meta.label}</option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Category">
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-1">
                          <Select
                            value={form.category_id}
                            onChange={(e) => setForm((current) => ({ ...current, category_id: e.target.value }))}
                          >
                            <option value="">No category</option>
                            {(cats || []).map((category) => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </Select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNewCategory}
                          title="Create category"
                          aria-label="Create category"
                        >
                          <Plus size={15} />
                        </Button>
                      </div>
                    </Field>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="personal-entry-title" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                      Entry title
                    </label>
                    <Input
                      id="personal-entry-title"
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Give your entry a clear title..."
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rose-100/70 pt-4 dark:border-white/10">
                    <Switch
                      checked={form.is_pinned}
                      onChange={(value) => setForm((current) => ({ ...current, is_pinned: value }))}
                      label="Pin this entry"
                    />
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                      <FolderOpen size={13} />
                      Personal Space library
                    </span>
                  </div>
                </section>

                {/* Rich text writing surface */}
                <section className="overflow-hidden rounded-2xl border border-rose-100/80 bg-white/90 shadow-[0_12px_36px_rgba(142,63,87,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100/80 px-4 py-3 dark:border-white/10 sm:px-6">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">Content editor</h2>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        Format your content with the toolbar below
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      Rich text
                    </span>
                  </div>
                  <div className="p-3 sm:p-5">
                    <RichEntryEditor
                      key={editing?.id || 'new-entry'}
                      value={form.content}
                      onChange={(content) => setForm((current) => ({ ...current, content }))}
                    />
                  </div>
                </section>

                <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                  <p className="text-[11px] text-slate-400">
                    Changes are applied when you select Save entry.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={close}>Cancel</Button>
                    <Button onClick={save} disabled={isSaving}>
                      <Save size={15} />
                      {isSaving ? 'Saving...' : 'Save entry'}
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}

        <EntryPreview
          entry={previewEntry}
          onClose={() => setPreviewEntry(null)}
          onEdit={() => {
            const entry = previewEntry;
            setPreviewEntry(null);
            if (entry) open(entry);
          }}
        />
      </main>
    </div>
  );
}
