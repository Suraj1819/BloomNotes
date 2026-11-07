
import { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  X,
  Save,
  ArrowLeft,
  Type,
  FolderOpen,
  CheckCircle2,
  PanelTop,
} from 'lucide-react';

import { relativeTime, cn } from '../../lib/utils.js';
import { useConfirm, usePrompt } from '../../contexts/ConfirmContext.jsx';

import lavenderBg from '../../../assets/background/fav.png';
import noteFlower from '../../../assets/background/note-card-flower.png';

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
    <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white/80 shadow-inner dark:border-white/10 dark:bg-slate-950/50">
      <div className="sticky top-0 z-10 border-b border-purple-100/80 bg-white/95 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
        {editor && <EditorToolbar editor={editor} />}
      </div>
      <div className="min-h-[360px] max-h-[calc(100vh-350px)] overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <EditorContent editor={editor} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-purple-100/70 px-4 py-2 text-[11px] text-slate-400 dark:border-white/10">
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
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50/80 px-3 py-1.5 text-xs font-bold text-[#7652C8] dark:border-purple-400/20 dark:bg-purple-500/10 dark:text-purple-300">
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

        <div className="rounded-2xl border border-purple-100/80 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
          <h2 className="mb-4 break-words text-2xl font-extrabold leading-tight text-[#252044] dark:text-white">
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

  const { data, isLoading } = useQuery({
    queryKey: ['ps-entries'],
    queryFn: () => personalSpaceApi.listEntries({ limit: 200 }),
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

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

  if (isLoading) return <PageLoader />;

  const entries = data?.items || [];
  const isSaving = create.isPending || update.isPending;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredEntries = entries.filter((entry) => {
    if (!normalizedSearch) return true;
    return [entry.title, entry.content, entry.kind]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const visibleEntries = filteredEntries.slice(0, visibleCount);

  return (
    <div
      className="relative isolate min-h-full overflow-hidden"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/0 dark:bg-black/0" />
      <style>{`
        .personal-space-editor-content { min-height: 260px; outline: none; }
        .personal-space-editor-content p { margin: 0.55rem 0; line-height: 1.8; }
        .personal-space-editor-content h1 { margin: 1.1rem 0 0.6rem; font-size: 1.7rem; font-weight: 800; line-height: 1.2; }
        .personal-space-editor-content h2 { margin: 1rem 0 0.55rem; font-size: 1.35rem; font-weight: 750; line-height: 1.3; }
        .personal-space-editor-content h3 { margin: 0.9rem 0 0.5rem; font-size: 1.12rem; font-weight: 700; }
        .personal-space-editor-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-editor-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-editor-content blockquote { border-left: 3px solid #a78bfa; margin: 1rem 0; padding: 0.25rem 0 0.25rem 1rem; color: #7c6a99; }
        .personal-space-editor-content a, .personal-space-preview-content a { color: #7652C8; text-decoration: underline; }
        .personal-space-editor-content table, .personal-space-preview-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .personal-space-editor-content th, .personal-space-editor-content td, .personal-space-preview-content th, .personal-space-preview-content td { border: 1px solid #d8cbed; padding: 0.5rem; text-align: left; }
        .personal-space-editor-content th, .personal-space-preview-content th { background: rgba(139, 92, 246, 0.08); font-weight: 700; }
        .personal-space-editor-content mark, .personal-space-preview-content mark { border-radius: 0.2rem; padding: 0 0.12rem; }
        .personal-space-editor-content p.is-editor-empty:first-child::before { color: #a69ab8; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .personal-space-preview-content p { margin: 0.6rem 0; white-space: pre-wrap; }
        .personal-space-preview-content h1, .personal-space-preview-content h2, .personal-space-preview-content h3 { margin: 1rem 0 0.55rem; font-weight: 800; line-height: 1.3; }
        .personal-space-preview-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-preview-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.7rem 0; }
        .personal-space-preview-content blockquote { border-left: 3px solid #a78bfa; margin: 1rem 0; padding-left: 1rem; }
        .dark .personal-space-editor-content th, .dark .personal-space-editor-content td, .dark .personal-space-preview-content th, .dark .personal-space-preview-content td { border-color: rgba(255,255,255,.16); }
      `}</style>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Page heading */}
        <section className="mb-6 overflow-hidden rounded-[26px] border border-white/70 bg-white/65 p-4 shadow-[0_8px_30px_rgba(91,55,150,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 text-[#7652C8] shadow-sm dark:border-white/10 dark:from-slate-800 dark:to-slate-900 dark:text-purple-300">
                <Sparkles size={21} />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#252044] dark:text-white sm:text-[28px]">
                    Personal Space
                  </h1>
                  <span className="rounded-full border border-purple-100 bg-purple-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7652C8] dark:border-purple-400/20 dark:bg-purple-500/10 dark:text-purple-300">
                    Private library
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#766A91] dark:text-slate-400">
                  Keep your notes, links, checklists and code snippets organized in one place.
                </p>
              </div>
            </div>

            <Button onClick={() => open()} className="shrink-0">
              <Plus size={15} />
              New entry
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-purple-100/80 bg-white/60 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2 text-[#8A7AA5] dark:text-slate-400">
                <FileText size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">All entries</span>
              </div>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-[#30254D] dark:text-white">{entries.length}</p>
            </div>
            <div className="rounded-2xl border border-purple-100/80 bg-white/60 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2 text-[#8A7AA5] dark:text-slate-400">
                <Pin size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Pinned</span>
              </div>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-[#30254D] dark:text-white">{entries.filter((entry) => entry.is_pinned).length}</p>
            </div>
            <div className="rounded-2xl border border-purple-100/80 bg-white/60 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2 text-[#8A7AA5] dark:text-slate-400">
                <ListChecks size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Checklists</span>
              </div>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-[#30254D] dark:text-white">{entries.filter((entry) => entry.kind === 'checklist').length}</p>
            </div>
            <div className="rounded-2xl border border-purple-100/80 bg-white/60 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2 text-[#8A7AA5] dark:text-slate-400">
                <LinkIcon size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Links</span>
              </div>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-[#30254D] dark:text-white">{entries.filter((entry) => entry.kind === 'link').length}</p>
            </div>
          </div>
        </section>

        {/* Search and view controls */}
        <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/55 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9486AA] dark:text-slate-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(9);
              }}
              placeholder="Search your personal space..."
              aria-label="Search personal entries"
              className="h-11 w-full rounded-xl border border-purple-100/80 bg-white/75 pl-10 pr-4 text-sm text-[#30254D] outline-none transition placeholder:text-[#A69AB8] focus:border-purple-300 focus:ring-2 focus:ring-purple-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-purple-500/10"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-[#8A7AA5] dark:text-slate-400">
              Showing <span className="font-bold text-[#6240C8] dark:text-purple-300">{visibleEntries.length}</span> of {filteredEntries.length}
            </p>
            <div className="flex shrink-0 items-center rounded-xl border border-purple-100 bg-white/75 p-1 dark:border-white/10 dark:bg-white/[0.04]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={cn(
                  'flex h-8 w-9 items-center justify-center rounded-lg transition',
                  viewMode === 'grid'
                    ? 'bg-[#7652C8] text-white shadow-sm'
                    : 'text-[#897BA2] hover:bg-purple-50 dark:text-slate-400 dark:hover:bg-white/10'
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={cn(
                  'flex h-8 w-9 items-center justify-center rounded-lg transition',
                  viewMode === 'list'
                    ? 'bg-[#7652C8] text-white shadow-sm'
                    : 'text-[#897BA2] hover:bg-purple-50 dark:text-slate-400 dark:hover:bg-white/10'
                )}
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* Personal entries */}
        {entries.length === 0 ? (
          <div className="rounded-[24px] border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
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
          <div className="rounded-[24px] border border-white/70 bg-white/60 px-5 py-12 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-[#7652C8] dark:bg-purple-500/10 dark:text-purple-300">
              <Search size={20} />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#30254D] dark:text-white">No matching entries</h3>
            <p className="mt-1 text-sm text-[#8A7AA5] dark:text-slate-400">Try another title, content keyword or entry type.</p>
          </div>
        ) : (
          <>
            <div className={cn(
              'grid gap-4 sm:gap-5',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1'
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
                      'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2',
                      'group relative isolate flex min-h-[285px] min-w-0 flex-col overflow-hidden rounded-[22px]',
                      'border border-white/70 bg-white/70 shadow-[0_4px_18px_rgba(91,55,150,0.07)] backdrop-blur-xl',
                      'transition-[border-color,box-shadow] duration-200 hover:border-[#CDA8FF] hover:shadow-[0_10px_28px_rgba(91,55,150,0.12)]',
                      'dark:border-white/10 dark:bg-slate-900/65',
                      viewMode === 'list' && 'min-h-0 sm:flex-row'
                    )}
                  >
                    {/* NoteCard-style accent stripe */}
                    <div className="pointer-events-none absolute bottom-[22%] left-0 top-[22%] z-20 w-1 rounded-r-full bg-gradient-to-b from-[#B99AEF] via-[#8D6BD0] to-[#D9B8F5]" />

                    {/* Floral artwork and soft glow */}
                    <div
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute -bottom-2 -right-2 z-0 h-40 w-40 bg-contain bg-right-bottom bg-no-repeat opacity-[0.18] transition-opacity duration-300 group-hover:opacity-25 dark:opacity-[0.10] dark:group-hover:opacity-[0.16]',
                        viewMode === 'list' && 'sm:h-36 sm:w-36'
                      )}
                      style={{ backgroundImage: `url(${noteFlower})` }}
                    />
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 z-0 h-36 w-36 rounded-full bg-purple-300/20 blur-3xl dark:bg-purple-500/10" />

                    <div className={cn(
                      'relative z-10 flex min-w-0 flex-1 flex-col p-5 pl-6 sm:p-6 sm:pl-7',
                      viewMode === 'list' && 'sm:flex-row sm:items-stretch sm:gap-6'
                    )}>
                      <div className="flex min-w-0 flex-1 flex-col">
                        {/* Card header */}
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-white/75 text-[#7652C8] shadow-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-purple-300">
                              <KindIcon size={19} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-[#6240C8] dark:text-purple-300">{Meta.label}</p>
                              <p className="mt-0.5 truncate text-[11px] text-[#9387A8] dark:text-slate-400">Personal collection</p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5">
                            {entry.is_pinned && (
                              <span title="Pinned" className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E8FF] text-[#7652C8] dark:bg-purple-950/60 dark:text-purple-300">
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
                                entry.is_pinned ? 'text-[#7652C8]' : 'text-[#81749D] dark:text-slate-400'
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
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#81749D] transition-colors hover:bg-[#F1E8FF] hover:text-[#6240C8] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-purple-300"
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
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#81749D] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-2 break-words text-[20px] font-bold leading-snug text-[#252044] dark:text-slate-100">
                            {entry.title || 'Untitled'}
                          </h3>
                          <p className="line-clamp-4 min-h-[3.5rem] whitespace-pre-wrap break-words text-[13px] leading-[1.85] text-[#51418F] dark:text-slate-300">
                            {entry.content || 'No additional content'}
                          </p>
                        </div>

                        {/* Card footer */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDE2FA] pt-3 dark:border-slate-700">
                          <div className="flex min-w-0 items-center gap-2">
                            <Clock3 size={14} className="shrink-0 text-[#81749D] dark:text-slate-400" />
                            <span className="truncate text-xs font-medium text-[#766A91] dark:text-slate-400">
                              Updated {relativeTime(entry.updated_at)}
                            </span>
                          </div>
                          <span className="shrink-0 rounded-full border border-[#E8D8FF] bg-white/75 px-2.5 py-1 text-[10px] font-semibold text-[#7652C8] dark:border-white/10 dark:bg-slate-800/80 dark:text-purple-300">
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
                  <ChevronDown size={15} />
                  Show 6 more
                </Button>
              </div>
            )}
            {visibleCount > 9 && filteredEntries.length > 9 && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(9)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#7652C8] transition hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-white/5"
                >
                  <ChevronUp size={14} />
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
            <header className="relative z-20 flex shrink-0 flex-col gap-3 border-b border-purple-100/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-white text-slate-600 transition hover:bg-purple-50 hover:text-purple-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="Close editor"
                    title="Back to Personal Space"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 text-white shadow-md shadow-purple-500/20">
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
                <section className="rounded-2xl border border-purple-100/80 bg-white/85 p-4 shadow-[0_8px_28px_rgba(91,55,150,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <PanelTop size={16} className="text-purple-600 dark:text-purple-300" />
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

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-purple-100/70 pt-4 dark:border-white/10">
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
                <section className="overflow-hidden rounded-2xl border border-purple-100/80 bg-white/90 shadow-[0_12px_36px_rgba(91,55,150,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100/80 px-4 py-3 dark:border-white/10 sm:px-6">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">Content editor</h2>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        Format your content with the toolbar below
                      </p>
                    </div>
                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
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
