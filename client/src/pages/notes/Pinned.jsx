
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { notesApi } from '../../services/index.js';
import { NoteCard } from '../../components/notes/NoteCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';

import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import {
  Pin,
  Search,
  X,
  RefreshCw,
  LayoutGrid,
  List,
  FileText,
  ArrowDownUp,
  Sparkles,
  SearchX,
  Bookmark,
} from 'lucide-react';

import lavenderBackground from '../../../assets/background/fav4.png';

const glass = 'bn-glass-card';

export default function Pinned() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(6);

  // Fetch pinned notes
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['notes', 'pinned', sort],
    queryFn: () =>
      notesApi.list({
        pinned: true,
        sort,
        limit: 100,
      }),
  });

  const notes = data?.items || [];
  const totalNotes = data?.total ?? notes.length;

  // Search pinned notes
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return notes;

    return notes.filter((note) => {
      const title = String(note.title || '').toLowerCase();
      const excerpt = String(note.excerpt || '').toLowerCase();
      const plainText = String(note.plain_text || '').toLowerCase();

      const content =
        typeof note.content === 'string'
          ? note.content.toLowerCase()
          : JSON.stringify(note.content || {}).toLowerCase();

      const tags = Array.isArray(note.tags)
        ? note.tags
            .map((tag) =>
              typeof tag === 'string' ? tag : tag?.name || ''
            )
            .join(' ')
            .toLowerCase()
        : '';

      return (
        title.includes(query) ||
        excerpt.includes(query) ||
        plainText.includes(query) ||
        content.includes(query) ||
        tags.includes(query)
      );
    });
  }, [notes, search]);

  // Reset pagination on search or sorting
  useEffect(() => {
    setVisibleCount(6);
  }, [search, sort]);

  const visibleNotes = filteredNotes.slice(0, visibleCount);
  const hasSearch = Boolean(search.trim());

  // Initial loading
  if (isLoading) return <PageLoader />;

  // Error state
  if (isError) {
    return (
      <div
        className="relative isolate flex min-h-[65vh] items-center justify-center overflow-hidden px-4 py-10"
        style={{
          backgroundImage: `url(${lavenderBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className={`${glass} w-full max-w-md rounded-3xl p-7 text-center sm:p-9`}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <Pin size={25} />
          </div>

          <h2 className="text-xl font-semibold text-text-main">
            Unable to load pinned notes
          </h2>

          <p className="mt-2 text-sm leading-6 text-text-muted">
            {error?.message || 'Your pinned notes could not be loaded.'}
          </p>

          <Button
            className="mt-6"
            onClick={() => refetch()}
            loading={isFetching}
            disabled={isFetching}
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

        {/* Header */}
        <header className="mb-7 sm:mb-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
                <Pin size={25} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                    Pinned Notes
                  </h1>

                  <span className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted backdrop-blur-xl">
                    {totalNotes} pinned
                  </span>
                </div>

                <p className="mt-1 text-sm text-text-muted">
                  Your important thoughts, always within easy reach.
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
                title="Refresh pinned notes"
              >
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                onClick={() => navigate('/app/notes')}
                className="flex-1 justify-center sm:flex-none"
              >
                <FileText size={16} />
                All Notes
              </Button>
            </div>
          </div>

          {/* Decorative divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <Pin size={14} className="text-accent/70" />
            <div className="h-px flex-1 bg-border/60" />
          </div>
        </header>

        {/* Search panel */}
        <section className={`${glass} mb-7 rounded-3xl p-3.5 sm:p-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pinned notes by title or content..."
                aria-label="Search pinned notes"
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

            {/* Sorting */}
            <div className="flex items-center gap-2 sm:w-auto">
              <span className="hidden items-center gap-1.5 text-xs font-medium text-text-muted sm:flex">
                <ArrowDownUp size={14} />
                Sort
              </span>

              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-12 w-full sm:w-48"
              >
                <option value="updated">Recently updated</option>
                <option value="created">Recently created</option>
                <option value="title">Title (A-Z)</option>
              </Select>
            </div>
          </div>

          {/* Search information */}
          {hasSearch && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
              <p className="text-xs text-text-muted">
                Showing {filteredNotes.length} result
                {filteredNotes.length !== 1 ? 's' : ''} for{' '}
                <strong className="text-text-main">
                  "{search}"
                </strong>
              </p>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        {/* Collection toolbar */}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bookmark size={17} className="text-accent" />

              <h2 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">
                Pinned Collection
              </h2>
            </div>

            <p className="mt-1 text-xs text-text-muted sm:text-sm">
              Notes you have marked as important.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* View toggle */}
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

        {/* Notes collection */}
        {filteredNotes.length === 0 ? (
          hasSearch ? (
            <div className={`${glass} rounded-3xl px-5 py-14 text-center sm:py-16`}>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <SearchX size={27} strokeWidth={1.8} />
              </div>

              <h3 className="text-lg font-semibold text-text-main">
                No matching pinned notes
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
                Try another keyword to find the note you are looking for.
              </p>

              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setSearch('')}
              >
                <RefreshCw size={15} />
                Clear search
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={Pin}
              title="No pinned notes yet"
              description="Notes you pin will appear here. Pin your important notes to access them quickly whenever you need them."
              action={
                <Button onClick={() => navigate('/app/notes')}>
                  <FileText size={15} />
                  Browse all notes
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

            {/* Show more */}
            {filteredNotes.length > visibleCount && (
              <div className="mt-7 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    setVisibleCount((count) => count + 6)
                  }
                >
                  <FileText size={15} />
                  Show more ({Math.min(6, filteredNotes.length - visibleCount)})
                </Button>
              </div>
            )}

            {/* Show less */}
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

        {/* Footer */}
        {filteredNotes.length > 0 && (
          <footer className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-border/50 pt-5 text-center text-xs text-text-muted">
            <Pin size={14} className="text-accent" />
            <span>
              Your pinned notes are always easy to find here.
            </span>
          </footer>
        )}

      </main>
    </div>
  );
}
