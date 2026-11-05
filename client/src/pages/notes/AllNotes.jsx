// src/pages/notes/AllNotes.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notesApi, tagsApi, foldersApi } from '../../services/index.js';
import { NoteCard } from '../../components/notes/NoteCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { PageLoader, EmptyState } from '../../components/ui/Spinner.jsx';
import { useNavigate } from 'react-router-dom';
import { NotebookPen, Plus } from 'lucide-react';

export default function AllNotes() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sort, setSort] = useState('updated');
  const [folderId, setFolderId] = useState('');
  const [tagId, setTagId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notes', { sort, folderId, tagId }],
    queryFn: () => notesApi.list({ sort, folder_id: folderId || undefined, tag_id: tagId || undefined, limit: 100 }),
  });
  const { data: folders } = useQuery({ queryKey: ['folders'], queryFn: () => foldersApi.list() });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() });

  const createNote = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled note' }),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      navigate(`/app/notes/${note.id}`);
    },
    onError: (e) => toast.error(e.message || 'Could not create note'),
  });

  if (isLoading) return <PageLoader />;
  const notes = data?.items || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-2xl text-text-main">All Notes</h1>
          <p className="text-sm text-text-muted">{data?.total || 0} notes</p>
        </div>
        <Button onClick={() => createNote.mutate()} loading={createNote.isPending}><Plus size={14} /> New note</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All folders</option>
          {(folders || []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
        <Select value={tagId} onChange={(e) => setTagId(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All tags</option>
          {(tags || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto min-w-[160px]">
          <option value="updated">Recently updated</option>
          <option value="created">Recently created</option>
          <option value="title">Title (A-Z)</option>
        </Select>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet" description="Create your first note — each one blooms in its own floral theme." action={<Button onClick={() => createNote.mutate()} loading={createNote.isPending}><Plus size={14} /> New note</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((n) => <NoteCard key={n.id} note={n} />)}
        </div>
      )}
    </div>
  );
}
