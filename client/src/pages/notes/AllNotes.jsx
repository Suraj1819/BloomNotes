
// src/pages/notes/AllNotes.jsx

import { useState } from 'react';
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
} from 'lucide-react';

import lavenderBackground from '../../../assets/background/lavender.png';

export default function AllNotes() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sort, setSort] = useState('updated');
  const [folderId, setFolderId] = useState('');
  const [tagId, setTagId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notes', { sort, folderId, tagId }],
    queryFn: () =>
      notesApi.list({
        sort,
        folder_id: folderId || undefined,
        tag_id: tagId || undefined,
        limit: 100,
      }),
  });

  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  const createNote = useMutation({
    mutationFn: () =>
      notesApi.create({ title: 'Untitled note' }),

    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      navigate(`/app/notes/${note.id}`);
    },

    onError: (e) => {
      toast.error(e.message || 'Could not create note');
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const notes = data?.items || [];

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-background"
      style={{
        backgroundImage: `url(${lavenderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dashboard Background Overlay */}

      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/10 dark:bg-slate-950/10" />

      {/* Main Content */}

      <main className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Header */}

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-main">
              All Notes
            </h1>

            <p className="mt-1 text-sm text-text-muted">
              {data?.total || 0} notes
            </p>
          </div>

          <Button
            onClick={() => createNote.mutate()}
            loading={createNote.isPending}
            disabled={createNote.isPending}
          >
            <Plus size={14} />
            New note
          </Button>
        </div>

        {/* Filters */}

        <div className="mb-5 flex flex-wrap gap-3">

          <Select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
          >
            <option value="">All folders</option>

            {(folders || []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>

          <Select
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
          >
            <option value="">All tags</option>

            {(tags || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
          >
            <option value="updated">Recently updated</option>
            <option value="created">Recently created</option>
            <option value="title">Title (A-Z)</option>
          </Select>

        </div>

        {/* Notes */}

        {notes.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No notes yet"
            description="Create your first note — each one blooms in its own floral theme."
            action={
              <Button
                onClick={() => createNote.mutate()}
                loading={createNote.isPending}
              >
                <Plus size={14} />
                New note
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
