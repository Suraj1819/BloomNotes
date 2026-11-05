
// src/pages/notes/Recent.jsx

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notesApi } from '../../services/index.js';
import { NoteCard } from '../../components/notes/NoteCard.jsx';
import { PageLoader, EmptyState } from '../../components/ui/Spinner.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Clock, Plus } from 'lucide-react';
import lavenderBg from '../../../assets/background/lavender.png';

export default function Recent() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'recent'],
    queryFn: () => notesApi.list({ limit: 50, sort: 'updated' }),
  });

  if (isLoading) return <PageLoader />;

  const notes = data?.items || [];

  return (
    <div
      className="relative isolate min-h-full overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${lavenderBg}")` }}
      />

      {/* Background Overlay */}
      <div className="absolute inset-0 z-0 bg-white/20 dark:bg-black/20" />

      {/* Page Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 py-8">

        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/85 dark:bg-gray-900/80 border border-[#E8D8FF] dark:border-white/10 shadow-sm">
            <Clock size={20} className="text-[#6240C8]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#10123D] dark:text-white">
              Recent
            </h1>

            <p className="text-sm text-[#51418F] dark:text-gray-300 mt-0.5">
              Pick up where you left off.
            </p>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] dark:border-white/10 bg-white/85 dark:bg-gray-900/85 p-6 shadow-sm">
            <EmptyState
              icon={Clock}
              title="Nothing here yet"
              description="Recently edited notes will appear here."
              action={
                <Button onClick={() => navigate('/app/notes')}>
                  <Plus size={14} />
                  Browse notes
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
