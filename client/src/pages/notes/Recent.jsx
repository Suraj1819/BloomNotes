
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
  Clock,
  Plus,
  History,
  Grid2X2,
  List,
  ChevronDown,
} from 'lucide-react';

import lavenderBg from '../../../assets/background/favv.png';

export default function Recent() {
  const navigate = useNavigate();

  const [view, setView] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(6);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['notes', 'recent'],
    queryFn: () =>
      notesApi.list({
        limit: 100,
        sort: 'updated',
      }),
  });

  const notes = data?.items || [];
  const visibleNotes = notes.slice(0, visibleCount);
  const hasMore = visibleCount < notes.length;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div
      className="relative isolate min-h-full overflow-hidden"
    >
      {/* Background image */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${lavenderBg}")`,
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Background overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-white/40 dark:bg-black/10"
      />

      {/* Page content */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/75 shadow-sm dark:bg-black/25">
              <Clock
                size={23}
                className="text-[#6240C8] dark:text-[#B9A4FF]"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
                Recent
              </h1>

              <p className="mt-1 text-sm text-text-muted">
                Pick up where you left off.
              </p>
            </div>
          </div>

          {/* Recent notes count */}
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-black/25 sm:self-auto">
            <History
              size={15}
              className="text-[#6240C8] dark:text-[#B9A4FF]"
            />

            <span className="text-sm font-medium text-text-main">
              {notes.length}{' '}
              {notes.length === 1 ? 'recent note' : 'recent notes'}
            </span>
          </div>

        </div>

        {/* Error state */}
        {isError ? (

          <div className="rounded-3xl border border-white/70 bg-white/70 px-5 py-12 text-center shadow-sm dark:border-white/10 dark:bg-black/25">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/50">
              <Clock
                size={22}
                className="text-rose-600 dark:text-rose-400"
              />
            </div>

            <h2 className="text-lg font-semibold text-text-main">
              Couldn't load recent notes
            </h2>

            <p className="mt-2 text-sm text-text-muted">
              Something went wrong while loading your notes.
              Please try again.
            </p>

            <Button
              onClick={() => refetch()}
              className="mt-5"
            >
              Try again
            </Button>

          </div>

        ) : notes.length === 0 ? (

          /* Empty state */
          <div className="rounded-3xl border border-white/70 bg-white/70 px-5 py-16 shadow-sm dark:border-white/10 dark:bg-black/25">
            <EmptyState
              icon={Clock}
              title="Nothing here yet"
              description="Your recently edited notes will appear here. Start writing to see your notes in this section."
              action={
                <Button
                  onClick={() => navigate('/app/notes')}
                  className="bg-[#6240C8] text-white hover:bg-[#5031AD]"
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
                  Recently edited
                </h2>

                <p className="mt-1 text-xs text-text-muted">
                  Your latest updated notes in one place.
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
                  ? 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3'
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
            {!hasMore && notes.length > 6 && (
              <p className="mt-8 text-center text-xs text-text-muted">
                You've viewed all {notes.length} recent notes.
              </p>
            )}

          </>
        )}

      </main>
    </div>
  );
}