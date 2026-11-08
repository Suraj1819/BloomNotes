
import { useEffect, useMemo, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import {
  notesApi,
  tagsApi,
  foldersApi,
} from '../../services/index.js';

import { NoteCard } from '../../components/notes/NoteCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';

import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import {
  NotebookPen,
  Plus,
  Search,
  SlidersHorizontal,
  Folder,
  Tag,
  ArrowDownUp,
  X,
  FileText,
  LayoutGrid,
  List,
  RefreshCw,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

import lavenderBackground from '../../../assets/background/fav4.png';

const glass = 'bn-glass-card';

export default function AllNotes() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sort, setSort] = useState('updated');
  const [folderId, setFolderId] = useState('');
  const [tagId, setTagId] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(6);

  // Notes
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['notes', { sort, folderId, tagId }],
    queryFn: () =>
      notesApi.list({
        sort,
        folder_id: folderId || undefined,
        tag_id: tagId || undefined,
        limit: 100,
      }),
  });

  // Folders
  const { data: foldersData = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  // Tags
  const { data: tagsData = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  const folders = Array.isArray(foldersData)
    ? foldersData
    : foldersData?.items || [];

  const tags = Array.isArray(tagsData)
    ? tagsData
    : tagsData?.items || [];

  const notes = data?.items || [];

  // Search
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return notes;

    return notes.filter((note) => {
      const title = String(note.title || '').toLowerCase();
      const content = String(
        note.content || note.plain_text || ''
      ).toLowerCase();

      return title.includes(query) || content.includes(query);
    });
  }, [notes, search]);

  // Reset pagination whenever the visible collection changes.
  useEffect(() => {
    setVisibleCount(6);
  }, [search, folderId, tagId, sort]);

  const visibleNotes = filteredNotes.slice(0, visibleCount);

  const activeFilterCount = [
    folderId,
    tagId,
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    folderId || tagId || search
  );

  const clearFilters = () => {
    setFolderId('');
    setTagId('');
    setSearch('');
  };

  // Create Note
  const createNote = useMutation({
    mutationFn: () =>
      notesApi.create({ title: 'Untitled note' }),

    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] });

      if (note?.id) {
        navigate(`/app/notes/${note.id}`);
      } else {
        toast.success('Note created successfully');
      }
    },

    onError: (e) => {
      toast.error(e.message || 'Could not create note');
    },
  });

  if (isLoading) return <PageLoader />;

  const totalNotes = data?.total ?? notes.length;

  // Error
  if (isError) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-4 py-10">
        <div className={`${glass} w-full max-w-md rounded-3xl p-7 text-center sm:p-9`}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <FileText size={25} />
          </div>

          <h2 className="text-xl font-semibold text-text-main">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm leading-6 text-text-muted">
            {error?.message || 'Your notes could not be loaded.'}
          </p>

          <Button
            className="mt-6"
            onClick={() => qc.invalidateQueries({ queryKey: ['notes'] })}
          >
            <RefreshCw size={15} />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${lavenderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay */}

      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80" />

      <main className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">

        {/* ======================================
            TOP HEADER
        ====================================== */}

        <header className="mb-7 sm:mb-9">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-center gap-3.5">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
                <NotebookPen size={25} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                    All Notes
                  </h1>

                  <span className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted backdrop-blur-xl">
                    {totalNotes} total
                  </span>
                </div>

                <p className="mt-1 text-sm text-text-muted">
                  Your personal space for thoughts and ideas.
                </p>
              </div>

            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">

              <Button
                onClick={() => createNote.mutate()}
                loading={createNote.isPending}
                disabled={createNote.isPending}
                className="w-full justify-center sm:w-auto"
              >
                <Plus size={16} />
                Create note
              </Button>

            </div>

          </div>

          {/* Small decorative divider */}

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <Sparkles
              size={14}
              className="text-accent/70"
            />
            <div className="h-px flex-1 bg-border/60" />
          </div>

        </header>

        {/* ======================================
            SEARCH PANEL
        ====================================== */}

        <section className={`${glass} mb-7 rounded-3xl p-3.5 sm:p-5`}>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* Search input */}

            <div className="relative min-w-0 flex-1">

              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes by title or content..."
                aria-label="Search notes"
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

            {/* Filter toggle */}

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-all ${
                showFilters || activeFilterCount
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-border/70 bg-card/50 text-text-main hover:bg-card/80'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}

              <ChevronDown
                size={15}
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

          </div>

          {/* Expandable filters */}

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/60 pt-4 sm:grid-cols-2 lg:grid-cols-3">

              <div className="min-w-0">
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <Folder size={14} />
                  Folder
                </label>

                <Select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="h-11 w-full"
                >
                  <option value="">All folders</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <Tag size={14} />
                  Tag
                </label>

                <Select
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  className="h-11 w-full"
                >
                  <option value="">All tags</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <ArrowDownUp size={14} />
                  Sort by
                </label>

                <Select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-11 w-full"
                >
                  <option value="updated">Recently updated</option>
                  <option value="created">Recently created</option>
                  <option value="title">Title (A-Z)</option>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center justify-end sm:col-span-2 lg:col-span-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
                  >
                    <X size={14} />
                    Reset filters
                  </button>
                </div>
              )}

            </div>
          )}

        </section>

        {/* ======================================
            COLLECTION TOOLBAR
        ====================================== */}

        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">

          <div>
            <div className="flex items-center gap-2">
              <LayoutGrid
                size={17}
                className="text-accent"
              />

              <h2 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">
                Your Collection
              </h2>
            </div>

            <p className="mt-1 text-xs text-text-muted sm:text-sm">
              Browse your notes and pick up where you left off.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/55 p-1 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-3 py-2 text-xs font-medium text-text-muted backdrop-blur-xl">
              <FileText size={14} />
              {filteredNotes.length} results
            </div>
          </div>

        </section>

        {/* ======================================
            ACTIVE SEARCH / FILTER INFO
        ====================================== */}

        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">

            {search && (
              <span className="rounded-full border border-border/60 bg-card/65 px-3 py-1.5 text-xs text-text-main backdrop-blur-lg">
                Search: <strong>{search}</strong>
              </span>
            )}

            {folderId && (
              <span className="rounded-full border border-border/60 bg-card/65 px-3 py-1.5 text-xs text-text-main backdrop-blur-lg">
                Folder: {folders.find((f) => String(f.id) === String(folderId))?.name || 'Selected'}
              </span>
            )}

            {tagId && (
              <span className="rounded-full border border-border/60 bg-card/65 px-3 py-1.5 text-xs text-text-main backdrop-blur-lg">
                Tag: {tags.find((t) => String(t.id) === String(tagId))?.name || 'Selected'}
              </span>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="px-2 py-1 text-xs font-semibold text-accent hover:underline"
            >
              Clear all
            </button>

          </div>
        )}

        {/* ======================================
            NOTES GRID
        ====================================== */}

        {filteredNotes.length === 0 ? (

          hasActiveFilters ? (

            <div className={`${glass} rounded-3xl px-5 py-14 text-center sm:py-16`}>

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Search size={27} strokeWidth={1.8} />
              </div>

              <h3 className="text-lg font-semibold text-text-main">
                No matching notes
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
                Try a different keyword or remove some filters to find your notes.
              </p>

              <Button
                variant="outline"
                className="mt-6"
                onClick={clearFilters}
              >
                <RefreshCw size={15} />
                Reset search
              </Button>

            </div>

          ) : (

            <EmptyState
              icon={NotebookPen}
              title="Your collection is empty"
              description="Every great idea starts somewhere. Create your first note and give your thoughts a place to grow."
              action={
                <Button
                  onClick={() => createNote.mutate()}
                  loading={createNote.isPending}
                  disabled={createNote.isPending}
                >
                  <Plus size={15} />
                  Create your first note
                </Button>
              }
            />

          )

        ) : (

          <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3'
                : 'flex flex-col gap-4'
            }
          >
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
              />
            ))}
          </div>

          {filteredNotes.length > visibleCount && (
            <div className="mt-7 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((count) => count + 6)}
              >
                <Plus size={15} />
                Show more ({Math.min(6, filteredNotes.length - visibleCount)})
              </Button>
            </div>
          )}

          {visibleCount > 6 && filteredNotes.length > 6 && (
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

        {/* ======================================
            BOTTOM FOOTER
        ====================================== */}

        {filteredNotes.length > 0 && (
          <div className="mt-8 border-t border-border/50 pt-5 text-center">
            <p className="text-xs text-text-muted">
              Showing {visibleNotes.length} of {filteredNotes.length} filtered notes ({totalNotes} total)
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
