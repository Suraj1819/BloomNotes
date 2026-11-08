
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { notesApi } from '../../services/index.js';
import { NoteCard } from '../../components/notes/NoteCard.jsx';

import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import { Button } from '../../components/ui/Button.jsx';

import {
  Pin,
  Plus,
  FileText,
  Grid2X2,
  List,
  ChevronDown,
} from 'lucide-react';

import lavenderBg from '../../../assets/background/favv1.png';

export default function Pinned() {
  const navigate = useNavigate();

  const [view, setView] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(6);

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notes', 'pinned'],
    queryFn: () =>
      notesApi.list({
        pinned: true,
        limit: 100,
      }),
  });

  const pinnedNotes = data?.items || [];
  const visibleNotes = pinnedNotes.slice(0, visibleCount);
  const hasMore = visibleCount < pinnedNotes.length;

  if (isLoading) {
    return <PageLoader />;
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
      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-white/40 dark:bg-black/80" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/50">
              <Pin
                size={23}
                className="text-rose-600 dark:text-rose-400"
                fill="currentColor"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
                Pinned Notes
              </h1>

              <p className="mt-1 text-sm text-text-muted">
                Keep your important thoughts within easy reach.
              </p>
            </div>
          </div>

          {/* Pinned count */}
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-black/25 sm:self-auto">
            <FileText size={15} className="text-rose-500" />

            <span className="text-sm font-medium text-text-main">
              {pinnedNotes.length}{' '}
              {pinnedNotes.length === 1 ? 'pinned note' : 'pinned notes'}
            </span>
          </div>

        </div>

        {/* Error state */}
        {isError ? (
          <div className="rounded-3xl border border-white/70 bg-white/70 px-5 py-12 text-center shadow-sm dark:border-white/10 dark:bg-black/25">
            <p className="text-sm text-text-muted">
              Unable to load pinned notes. Please try again.
            </p>
          </div>
        ) : pinnedNotes.length === 0 ? (

          /* Empty state */
          <div className="rounded-3xl border border-white/70 bg-white/70 px-5 py-16 shadow-sm dark:border-white/10 dark:bg-black/25">
            <EmptyState
              icon={Pin}
              title="No pinned notes yet"
              description="Pin your important notes to find them easily."
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

        ) : (

          <>
            {/* Section heading and view toggle */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-main">
                  Your pinned notes
                </h2>

                <p className="mt-1 text-xs text-text-muted">
                  Your important notes, all in one place.
                </p>
              </div>

              {/* Grid / List buttons */}
              <div className="flex items-center gap-1 rounded-xl border border-white/70 bg-white/65 p-1 shadow-sm dark:border-white/10 dark:bg-black/25">

                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                    view === 'grid'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'text-text-muted hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <Grid2X2 size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                    view === 'list'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'text-text-muted hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <List size={18} />
                </button>

              </div>
            </div>

            {/* Notes */}
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
                  onClick={() =>
                    setVisibleCount((count) => count + 6)
                  }
                  className="gap-2 border border-white/70 bg-white/70 text-text-main shadow-sm hover:bg-white dark:border-white/10 dark:bg-black/25 dark:hover:bg-black/40"
                >
                  Show More
                  <ChevronDown size={16} />
                </Button>
              </div>
            )}

            {/* All notes shown */}
            {!hasMore && pinnedNotes.length > 6 && (
              <p className="mt-8 text-center text-xs text-text-muted">
                You've viewed all {pinnedNotes.length} pinned notes.
              </p>
            )}

          </>
        )}

      </div>
    </div>
  );
}
