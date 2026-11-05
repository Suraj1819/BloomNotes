// src/pages/notes/Favorites.jsx

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
  Star,
  Plus,
  Heart,
} from 'lucide-react';

import lavenderBg from '../../../assets/background/lavender.png';

export default function Favorites() {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ['notes', 'favorites'],
    queryFn: () =>
      notesApi.list({
        favorite: true,
        limit: 100,
      }),
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const notes = data?.items || [];

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
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
              <Star
                size={23}
                className="text-rose-600 dark:text-rose-400"
                fill="currentColor"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-main">
                Favorites
              </h1>

              <p className="text-sm text-text-muted mt-1">
                Your favorite notes, all in one place.
              </p>
            </div>
          </div>

          {/* Favorite count */}
          <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-white/70 dark:border-white/10 bg-white/65 dark:bg-black/25 px-4 py-2 shadow-sm">
            <Heart
              size={15}
              className="text-rose-500"
              fill="currentColor"
            />

            <span className="text-sm font-medium text-text-main">
              {notes.length} {notes.length === 1 ? 'favorite' : 'favorites'}
            </span>
          </div>

        </div>

        {/* Notes */}
        {notes.length === 0 ? (

          <div className="rounded-3xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-black/25 shadow-sm px-5 py-16">
            <EmptyState
              icon={Star}
              title="No favorites yet"
              description="Save your important notes by tapping the star icon on any note."
              action={
                <Button
                  onClick={() => navigate('/app/notes')}
                  className="bg-[#B8326B] hover:bg-[#9F285B] text-white"
                >
                  <Plus size={15} />
                  Browse notes
                </Button>
              }
            />
          </div>

        ) : (

          <>
            {/* Section heading */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-text-main">
                  Saved notes
                </h2>

                <p className="text-xs text-text-muted mt-1">
                  Notes you've marked as favorites.
                </p>
              </div>
            </div>

            {/* Notes grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                />
              ))}
            </div>
          </>

        )}

      </div>
    </div>
  );
}