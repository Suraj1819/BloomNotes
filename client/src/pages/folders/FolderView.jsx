
// src/pages/folders/FolderView.jsx

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Search,
  X,
  FileText,
  LayoutGrid,
  List,
  ChevronDown,
} from 'lucide-react';

import { foldersApi, notesApi } from '../../services/index.js';

import { NoteCard } from '../../components/notes/NoteCard.jsx';

import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import { extractTextFromContent } from '../../lib/utils.js';

import lavenderBg from '../../../assets/background/favv1.png';

export default function FolderView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(6);

  // Fetch folders
  const {
    data: foldersData,
  } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  const folders = Array.isArray(foldersData)
    ? foldersData
    : foldersData?.items || [];

  // Fetch notes belonging to this folder
  const {
    data: notesData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['notes', { folderId: id }],
    queryFn: () =>
      notesApi.list({
        folder_id: id,
        limit: 200,
      }),
    enabled: Boolean(id),
  });

  // Safely read API response
  const noteItems = Array.isArray(notesData)
    ? notesData
    : notesData?.items || notesData?.data?.items || [];

  const totalNotes =
    notesData?.total ??
    notesData?.data?.total ??
    noteItems.length;

  const folder = folders.find(
    (item) => String(item.id) === String(id)
  );

  // Search notes, including rich-text content
  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return noteItems;

    return noteItems.filter((note) => {
      const title = note.title || '';

      const content = extractTextFromContent(
        note.content || ''
      );

      const excerpt = note.excerpt || '';

      return (
        title.toLowerCase().includes(term) ||
        content.toLowerCase().includes(term) ||
        excerpt.toLowerCase().includes(term)
      );
    });
  }, [noteItems, search]);

  const visibleNotes = filteredNotes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNotes.length;

  const handleSearch = (value) => {
    setSearch(value);
    setVisibleCount(6);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div
        className="relative flex min-h-[60vh] items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${lavenderBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-white/20 dark:bg-black/80" />

        <div className="relative z-10 mx-4 w-full max-w-md rounded-[24px] border border-border/60 bg-card/80 p-8 text-center shadow-lg backdrop-blur-xl">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <FolderOpen size={26} />
          </div>

          <h2 className="text-lg font-bold text-text-main">
            Unable to load folder notes
          </h2>

          <p className="mt-2 text-sm text-text-muted">
            Something went wrong while loading your notes.
            Please try again.
          </p>

          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-5"
          >
            {isFetching ? 'Refreshing...' : 'Try again'}
          </Button>

        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-full overflow-hidden"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/40 dark:bg-black/20" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Back navigation */}
        <button
          type="button"
          onClick={() => navigate('/app/folders')}
          className="group mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-text-muted transition hover:bg-white/50 hover:text-accent dark:hover:bg-black/20"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          All folders
        </button>

        {/* Folder header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <FolderOpen size={23} />
            </div>

            <div className="min-w-0">

              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-600 dark:text-rose-400">
                  Your collection
                </span>

                <span className="h-1 w-1 rounded-full bg-rose-400" />

                <span className="text-xs text-text-muted">
                  Folder
                </span>
              </div>

              <h1 className="break-words text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
                {folder?.name || 'Folder'}
              </h1>

              <p className="mt-1 text-sm text-text-muted">
                Organize and access your saved notes in one place.
              </p>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-black/25">
              <FileText size={15} className="text-rose-500" />

              <span className="text-sm font-medium text-text-main">
                {totalNotes} notes
              </span>
            </div>

            <Button
              onClick={() => navigate('/app/notes')}
              className="bg-[#B8326B] text-white hover:bg-[#9F285B]"
            >
              <Plus size={16} />
              Browse notes
            </Button>

          </div>
        </div>

        {/* Notes heading and controls */}
        <div className="mb-5">

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-text-main">
                Notes
              </h2>

              <p className="mt-1 text-sm text-text-muted">
                All notes saved in this folder.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              {/* Search */}
              <div className="relative w-full sm:w-64">

                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />

                <Input
                  value={search}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder="Search notes..."
                  className="border-white/70 bg-white/70 pl-10 pr-10 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/25"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-main"
                  >
                    <X size={15} />
                  </button>
                )}

              </div>

              {/* Grid / List */}
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/70 bg-white/65 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/25">

                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  className={`flex h-9 w-10 items-center justify-center rounded-lg transition ${
                    view === 'grid'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'text-text-muted hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <LayoutGrid size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  className={`flex h-9 w-10 items-center justify-center rounded-lg transition ${
                    view === 'list'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'text-text-muted hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <List size={18} />
                </button>

              </div>

            </div>
          </div>

          {noteItems.length > 0 && (
            <div className="flex items-center justify-between border-b border-border/50 pb-4">

              <span className="text-xs font-medium text-text-muted">
                {filteredNotes.length}{' '}
                {filteredNotes.length === 1 ? 'note' : 'notes'}
              </span>

              {filteredNotes.length > 0 && (
                <span className="text-xs text-text-muted">
                  Showing {visibleNotes.length} of {filteredNotes.length}
                </span>
              )}

            </div>
          )}

        </div>

        {/* Empty folder */}
        {noteItems.length === 0 ? (

          <div className="rounded-[22px] border border-white/70 bg-white/70 px-5 py-12 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/25">

            <EmptyState
              icon={FolderOpen}
              title="Folder is empty"
              description="Browse your notes and organize them into this folder."
              action={
                <Button
                  onClick={() => navigate('/app/notes')}
                  className="bg-[#B8326B] text-white hover:bg-[#9F285B]"
                >
                  <Plus size={15} />
                  Browse notes
                </Button>
              }
            />

          </div>

        ) : filteredNotes.length === 0 ? (

          /* No search results */
          <div className="rounded-[22px] border border-white/70 bg-white/70 px-5 py-12 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/25">

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Search size={22} />
            </div>

            <h3 className="font-semibold text-text-main">
              No matching notes
            </h3>

            <p className="mt-1 text-sm text-text-muted">
              Try searching with another title or keyword.
            </p>

            <Button
              variant="ghost"
              onClick={() => handleSearch('')}
              className="mt-3"
            >
              <X size={15} />
              Clear search
            </Button>

          </div>

        ) : (

          <>
            {/* Original NoteCard component */}
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
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

            {/* Show More */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVisibleCount((count) => count + 6);
                  }}
                  className="border-rose-200 bg-white/70 text-rose-600 shadow-sm backdrop-blur-xl hover:bg-rose-50 dark:border-rose-900/50 dark:bg-black/25 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  Show More
                  <ChevronDown size={16} />
                </Button>
              </div>
            )}

          </>
        )}

      </div>
    </div>
  );
}
