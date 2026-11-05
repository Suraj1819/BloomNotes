
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Pin,
  Plus,
  Search,
  Grid2X2,
  List,
  RefreshCw,
  ArrowUpDown,
  X,
  FileText,
  Clock3,
  SearchX,
  Flower2,
  ChevronRight,
} from 'lucide-react';

import { notesApi } from '../../services/index.js';
import { NoteCard } from '../../components/notes/NoteCard.jsx';
import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

// Automatically load a flower background from either location.
const backgroundImages = {
  ...import.meta.glob('../../../assets/background/*.{png,jpg,jpeg,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
  ...import.meta.glob('../../assets/background/*.{png,jpg,jpeg,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
};

const flowerBackground =
  Object.entries(backgroundImages).find(([path]) =>
    /flower|lavender|background/i.test(path)
  )?.[1] || Object.values(backgroundImages)[0];

const midnightRose = '#8E3B63';

export default function Pinned() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [view, setView] = useState('grid');

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['notes', 'pinned'],
    queryFn: () =>
      notesApi.list({
        pinned: true,
        limit: 100,
      }),
  });

  const notes = data?.items || [];

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = notes.filter((note) => {
      if (!query) return true;

      const searchableText = [
        note.title,
        note.content,
        note.body,
        note.description,
        ...(Array.isArray(note.tags)
          ? note.tags.map((tag) =>
              typeof tag === 'string' ? tag : tag.name
            )
          : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });

    result = [...result];

    if (sortBy === 'recent') {
      result.sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at || 0) -
          new Date(a.updated_at || a.created_at || 0)
      );
    } else if (sortBy === 'oldest') {
      result.sort(
        (a, b) =>
          new Date(a.created_at || 0) -
          new Date(b.created_at || 0)
      );
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) =>
        (a.title || 'Untitled').localeCompare(
          b.title || 'Untitled'
        )
      );
    }

    return result;
  }, [notes, search, sortBy]);

  if (isLoading) {
    return <PageLoader />;
  }

  const buttonStyle = {
    backgroundColor: midnightRose,
    color: '#ffffff',
  };

  return (
    <div
      className="pinned-page relative isolate min-h-full overflow-hidden"
      style={{
        backgroundColor: '#FAF5FC',
        backgroundImage: flowerBackground
          ? `url("${flowerBackground}")`
          : 'radial-gradient(circle at 85% 10%, #E9D5FF, transparent 35%), radial-gradient(circle at 10% 90%, #F3D8EF, transparent 35%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Very light overlay. The flower image remains sharp. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(250,240,255,0.12))',
        }}
      />

      <style>{`
        .pinned-page {
          font-family: Calibri, Arial, sans-serif;
        }

        .pinned-page .pinned-panel {
          background: rgba(255, 255, 255, 0.91);
          border: 1px solid rgba(190, 155, 220, 0.34);
          box-shadow: 0 5px 18px rgba(65, 35, 90, 0.07);
          backdrop-filter: none;
        }

        .pinned-page .pinned-note-grid .bn-card {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(190, 155, 220, 0.38);
          border-radius: 20px;
          box-shadow: 0 5px 16px rgba(65, 35, 90, 0.08);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .pinned-page .pinned-note-grid .bn-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(65, 35, 90, 0.13);
        }

        .pinned-page input,
        .pinned-page select,
        .pinned-page button {
          font-family: Calibri, Arial, sans-serif;
        }

        .pinned-page .rose-button {
          background: ${midnightRose};
          color: white;
          border: 1px solid ${midnightRose};
          transition: background 180ms ease, transform 180ms ease;
        }

        .pinned-page .rose-button:hover {
          background: #71304F;
          transform: translateY(-1px);
        }

        .pinned-page .rose-outline {
          border: 1px solid rgba(142, 59, 99, 0.3);
          color: ${midnightRose};
          background: rgba(255,255,255,0.92);
        }

        .pinned-page .rose-outline:hover {
          background: #F9EDF3;
        }

        .pinned-page .pinned-input {
          background: rgba(255,255,255,0.94);
          border: 1px solid rgba(190, 155, 220, 0.4);
          color: #21152D;
        }

        .pinned-page .pinned-input:focus {
          border-color: ${midnightRose};
          box-shadow: 0 0 0 3px rgba(142,59,99,0.09);
        }

        .pinned-page .pinned-input::placeholder {
          color: #8B7B99;
        }

        @media (prefers-reduced-motion: reduce) {
          .pinned-page * {
            transition: none !important;
          }
        }
      `}</style>

      <div className="relative mx-auto min-h-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm font-medium text-[#594477]">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="transition hover:text-[#8E3B63]"
            aria-label="Home"
          >
            <Flower2 size={19} />
          </button>

          <ChevronRight size={15} className="text-[#A88CBF]" />

          <button
            type="button"
            onClick={() => navigate('/app/notes')}
            className="transition hover:text-[#8E3B63]"
          >
            Notes
          </button>

          <ChevronRight size={15} className="text-[#A88CBF]" />

          <span className="font-semibold text-[#21152D]">
            Pinned
          </span>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{
                background: 'linear-gradient(145deg, #A65A83, #71304F)',
              }}
            >
              <Pin size={30} fill="currentColor" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#21152D] sm:text-4xl">
                Pinned Notes
              </h1>
              <p className="mt-1 text-base text-[#594477] sm:text-lg">
                Keep your important thoughts within easy reach.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh pinned notes"
              className="rose-outline flex h-12 w-12 items-center justify-center rounded-xl shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                size={19}
                className={isFetching ? 'animate-spin' : ''}
              />
            </button>

            <button
              type="button"
              onClick={() => navigate('/app/notes')}
              className="rose-button flex h-12 items-center gap-2 rounded-xl px-5 font-semibold shadow-md"
              style={buttonStyle}
            >
              <Plus size={19} />
              New note
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid max-w-2xl grid-cols-2 gap-4">
          <div className="pinned-panel flex items-center gap-4 rounded-2xl p-4 sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F1E7FA] text-[#713A9B]">
              <Pin size={25} />
            </div>

            <div>
              <p className="text-sm font-medium text-[#594477]">
                Total pinned
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#21152D]">
                {notes.length}
              </p>
            </div>
          </div>

          <div className="pinned-panel flex items-center gap-4 rounded-2xl p-4 sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F1E7FA] text-[#713A9B]">
              <FileText size={25} />
            </div>

            <div>
              <p className="text-sm font-medium text-[#594477]">
                Showing
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#21152D]">
                {filteredNotes.length}
              </p>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        {notes.length > 0 && (
          <div className="pinned-panel mb-7 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#70528B]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your pinned notes..."
                  className="pinned-input h-12 w-full rounded-xl pl-12 pr-11 text-base outline-none transition"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#70528B] hover:text-[#8E3B63]"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">

                {/* Sort */}
                <div className="relative min-w-0 flex-1 sm:flex-none">
                  <ArrowUpDown
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#70528B]"
                  />

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="pinned-input h-12 w-full appearance-none rounded-xl pl-9 pr-8 text-sm font-medium outline-none sm:w-auto"
                    aria-label="Sort pinned notes"
                  >
                    <option value="recent">Recently updated</option>
                    <option value="oldest">Oldest first</option>
                    <option value="alphabetical">A to Z</option>
                  </select>
                </div>

                {/* View toggle */}
                <div className="flex h-12 items-center rounded-xl border border-[#DCC9EA] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                      view === 'grid'
                        ? 'text-white shadow-sm'
                        : 'text-[#594477] hover:bg-[#F6EFFA]'
                    }`}
                    style={
                      view === 'grid'
                        ? { backgroundColor: midnightRose }
                        : undefined
                    }
                  >
                    <Grid2X2 size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('list')}
                    aria-label="List view"
                    aria-pressed={view === 'list'}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                      view === 'list'
                        ? 'text-white shadow-sm'
                        : 'text-[#594477] hover:bg-[#F6EFFA]'
                    }`}
                    style={
                      view === 'list'
                        ? { backgroundColor: midnightRose }
                        : undefined
                    }
                  >
                    <List size={19} />
                  </button>
                </div>
              </div>
            </div>

            {search && (
              <div className="mt-3 flex items-center justify-between border-t border-[#E9DDF1] pt-3">
                <p className="text-sm text-[#594477]">
                  {filteredNotes.length} result
                  {filteredNotes.length !== 1 ? 's' : ''} for "{search}"
                </p>

                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: midnightRose }}
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="pinned-panel rounded-2xl p-8 text-center">
            <p className="text-lg font-semibold text-[#21152D]">
              Unable to load pinned notes
            </p>
            <p className="mt-2 text-sm text-[#705C80]">
              Check your connection and try again.
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="rose-button mt-5 rounded-xl px-5 py-2.5 font-semibold"
              style={buttonStyle}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isError && notes.length === 0 && (
          <div className="pinned-panel rounded-2xl px-5 py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1E7FA] text-[#713A9B]">
              <Pin size={29} />
            </div>

            <h2 className="text-xl font-bold text-[#21152D]">
              Nothing pinned yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#705C80]">
              Pin your important notes and they will appear here for quick access.
            </p>

            <button
              type="button"
              onClick={() => navigate('/app/notes')}
              className="rose-button mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold"
              style={buttonStyle}
            >
              <Plus size={17} />
              Browse notes
            </button>
          </div>
        )}

        {/* No search results */}
        {!isError && notes.length > 0 && filteredNotes.length === 0 && (
          <div className="pinned-panel rounded-2xl px-5 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1E7FA] text-[#713A9B]">
              <SearchX size={26} />
            </div>

            <h2 className="text-xl font-bold text-[#21152D]">
              No matching notes
            </h2>

            <p className="mt-2 text-sm text-[#705C80]">
              Try searching with another keyword.
            </p>

            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 text-sm font-semibold hover:underline"
              style={{ color: midnightRose }}
            >
              Clear search
            </button>
          </div>
        )}

        {/* Notes collection */}
        {!isError && filteredNotes.length > 0 && (
          <>
            <div className="pinned-panel mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-[#21152D]">
                  Your collection
                </h2>
                <p className="mt-0.5 text-sm text-[#705C80]">
                  {filteredNotes.length} pinned note
                  {filteredNotes.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-[#594477]">
                <Clock3 size={17} />
                <span>
                  {sortBy === 'recent'
                    ? 'Recently updated'
                    : sortBy === 'oldest'
                      ? 'Oldest first'
                      : 'Alphabetical'}
                </span>
              </div>
            </div>

            <div
              className={
                `pinned-note-grid ${
                  view === 'grid'
                    ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3'
                    : 'flex flex-col gap-4'
                }`
              }
            >
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        {notes.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-3 pb-5 text-center">
            <div className="hidden h-px w-16 bg-[#D8BCE9] sm:block" />
            <Pin
              size={19}
              style={{ color: midnightRose }}
              fill={midnightRose}
            />
            <p className="text-sm font-semibold text-[#71304F] sm:text-base">
              Your pinned notes are always one click away.
            </p>
            <div className="hidden h-px w-16 bg-[#D8BCE9] sm:block" />
          </div>
        )}
      </div>
    </div>
  );
}
