
// src/pages/folders/FolderView.jsx

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Search,
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

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center font-['Calibri',sans-serif]">
        <FolderOpen
          size={32}
          className="mx-auto mb-3 text-text-muted"
        />

        <p className="mb-4 text-text-main">
          Unable to load folder notes.
        </p>

        <Button onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-full overflow-hidden font-['Calibri',sans-serif]"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-white/55 dark:bg-black/45" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/app/folders')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#51418F] transition hover:text-[#6240C8] dark:text-slate-300 dark:hover:text-purple-400"
        >
          <ArrowLeft size={16} />
          All folders
        </button>

        {/* Folder header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] shadow-sm dark:bg-purple-950/50 dark:text-purple-400">
              <FolderOpen size={27} />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight text-[#10123D] dark:text-slate-100 sm:text-3xl">
                {folder?.name || 'Folder'}
              </h1>

              <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
                {notes?.total ?? noteItems.length} notes in this folder
              </p>
            </div>

          </div>

          <Button
            onClick={() => navigate('/app/notes')}
            className="self-start sm:self-auto"
          >
            <Plus size={16} />
            Browse notes
          </Button>

        </div>

        {/* Notes heading */}
        <div className="mb-5 flex items-center justify-between border-b border-[#E8D8FF] pb-3 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-[#10123D] dark:text-slate-100">
              Notes
            </h2>

            <p className="mt-0.5 text-sm text-[#51418F] dark:text-slate-400">
              All notes saved in this folder.
            </p>
          </div>

          <span className="rounded-full border border-[#E8D8FF] bg-white/70 px-3 py-1 text-xs font-semibold text-[#6240C8] dark:border-slate-700 dark:bg-slate-900/70 dark:text-purple-400">
            {noteItems.length} items
          </span>
        </div>

        {/* Notes */}
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
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {noteItems.map((note) => (
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
