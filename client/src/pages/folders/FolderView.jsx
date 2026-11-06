
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
  ArrowUpRight,
} from 'lucide-react';

import { foldersApi, notesApi } from '../../services/index.js';

import { NoteCard } from '../../components/notes/NoteCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import lavenderBg from '../../../assets/background/lavender.png';

export default function FolderView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');

  const {
    data: folders = [],
  } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  const {
    data: notes,
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
  });

  const folder = folders.find((f) => f.id === id);
  const noteItems = notes?.items || [];

  const filteredNotes = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) return noteItems;

    return noteItems.filter((note) => {
      const title = note.title?.toLowerCase() || '';
      const content = note.content?.toLowerCase() || '';

      return (
        title.includes(searchTerm) ||
        content.includes(searchTerm)
      );
    });
  }, [noteItems, search]);

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
        <div className="pointer-events-none absolute inset-0 bg-white/40 dark:bg-black/40" />

        <div className="relative z-10 mx-4 w-full max-w-md rounded-[24px] border border-[#E8D8FF] bg-white/85 p-8 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900/85">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] dark:bg-purple-950/50 dark:text-purple-400">
            <FolderOpen size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#10123D] dark:text-slate-100">
            Unable to load folder notes
          </h2>

          <p className="mt-2 text-sm text-[#51418F] dark:text-slate-400">
            Something went wrong while loading your notes. Please try again.
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
      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-white/20 dark:bg-black/30" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Back navigation */}
        <button
          type="button"
          onClick={() => navigate('/app/folders')}
          className="group mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-[#51418F] transition hover:bg-white/50 hover:text-[#6240C8] dark:text-slate-300 dark:hover:bg-slate-900/50 dark:hover:text-purple-400"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          All folders
        </button>

        {/* Folder header */}
        <div className="mb-8 overflow-hidden rounded-[24px] border border-[#E8D8FF] bg-white/75 p-5 shadow-[0_4px_16px_rgba(91,55,150,0.07)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] dark:bg-purple-950/50 dark:text-purple-400">
                <FolderOpen size={27} />
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8068B9] dark:text-purple-300">
                    Your collection
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#B59BD9]" />

                  <span className="text-xs text-[#8068B9] dark:text-slate-400">
                    Folder
                  </span>
                </div>

                <h1 className="break-words text-2xl font-bold tracking-tight text-[#10123D] dark:text-slate-100 sm:text-3xl">
                  {folder?.name || 'Folder'}
                </h1>

                <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
                  Organize and access your saved notes in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <div className="flex items-center gap-2 rounded-xl border border-[#E8D8FF] bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                <FileText
                  size={16}
                  className="text-[#8068B9] dark:text-purple-300"
                />

                <span className="text-sm font-semibold text-[#51418F] dark:text-slate-300">
                  {notes?.total ?? noteItems.length} notes
                </span>
              </div>

              <Button
                onClick={() => navigate('/app/notes')}
              >
                <Plus size={16} />
                Browse notes
                <ArrowUpRight size={15} />
              </Button>
            </div>

          </div>
        </div>

        {/* Notes section heading */}
        <div className="mb-5 flex flex-col gap-4 border-b border-[#E8D8FF] pb-4 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <LayoutGrid
                size={17}
                className="text-[#6240C8] dark:text-purple-400"
              />

              <h2 className="text-lg font-bold text-[#10123D] dark:text-slate-100">
                Notes
              </h2>
            </div>

            <p className="text-sm text-[#51418F] dark:text-slate-400">
              All notes saved in this folder.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8068B9]"
              />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                className="bg-white/75 pl-10 pr-10 dark:bg-slate-900/70"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-main"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#E8D8FF] bg-white/70 px-3 py-2 text-xs font-semibold text-[#6240C8] dark:border-slate-700 dark:bg-slate-900/70 dark:text-purple-400">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Notes content */}
        {noteItems.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <EmptyState
              icon={FolderOpen}
              title="Folder is empty"
              description="Browse your notes and organize them into this folder."
              action={
                <Button onClick={() => navigate('/app/notes')}>
                  <Plus size={15} />
                  Browse notes
                </Button>
              }
            />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] dark:bg-purple-950/50 dark:text-purple-400">
              <Search size={22} />
            </div>

            <h3 className="font-semibold text-[#10123D] dark:text-slate-100">
              No matching notes
            </h3>

            <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
              Try searching with another title or keyword.
            </p>

            <Button
              variant="ghost"
              onClick={() => setSearch('')}
              className="mt-3"
            >
              <X size={15} />
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
