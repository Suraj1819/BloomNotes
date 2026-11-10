import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { notesApi } from '../../services/index.js';

import { Button } from '../../components/ui/Button.jsx';
import { PageLoader, EmptyState } from '../../components/ui/Spinner.jsx';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import {
  Trash2,
  RotateCcw,
  FileText,
  Clock3,
  AlertTriangle,
  Sparkles,
  Search,
  X,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

import {
  relativeTime,
  excerptFromContent,
} from '../../lib/utils.js';

import lavenderBg from '../../../assets/background/fav4.png';

export default function Trash() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['notes', 'trash'],
    queryFn: () =>
      notesApi.list({
        deleted: true,
        limit: 200,
      }),
  });

  // Restore note
  const restore = useMutation({
    mutationFn: (id) => notesApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note restored successfully');
    },
    onError: () => {
      toast.error('Unable to restore note');
    },
  });

  // Permanently delete note
  const purge = useMutation({
    mutationFn: (id) => notesApi.permanentDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note permanently deleted');
    },
    onError: () => {
      toast.error('Unable to delete note');
    },
  });

  const handlePurge = async (id, title) => {
    const ok = await confirm({
      title: 'Permanently delete note?',
      description: `"${title || 'Untitled'}" will be gone forever. This action cannot be undone.`,
      confirmText: 'Delete permanently',
      danger: true,
    });

    if (ok) {
      purge.mutate(id);
    }
  };

  const notes = data?.items || [];

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter((note) => {
      const title = (note.title || 'Untitled').toLowerCase();
      const excerpt = (excerptFromContent(note.content) || '').toLowerCase();
      return title.includes(query) || excerpt.includes(query);
    });
  }, [notes, search]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80" />

      <main className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
        {/* Archive-style page header */}
        <section className="mb-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
                <Trash2 size={22} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                    Trash
                  </h1>
                  <span className="inline-flex items-center rounded-full border border-rose-200/70 bg-rose-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
                    Deleted items
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  Manage deleted notes and restore them whenever you need.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3.5 py-2.5 shadow-sm backdrop-blur-xl">
                <FileText size={15} className="text-text-muted" />
                <span className="text-sm font-semibold tabular-nums text-text-main">
                  {notes.length}
                </span>
                <span className="text-sm text-text-muted">
                  {notes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-10 rounded-xl border-border/70 bg-card/70 px-3 backdrop-blur-xl"
              >
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </section>

        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        {/* Retention notice */}
        <section className="bn-glass-card mb-6 flex items-start gap-3 rounded-3xl border border-amber-200/60 bg-amber-50/65 p-4 shadow-sm backdrop-blur-xl dark:border-amber-900/35 dark:bg-amber-950/20 sm:items-center sm:px-5 sm:py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/70 bg-amber-100/80 text-amber-600 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-300">
              Notes in Trash
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/75 dark:text-amber-200/70 sm:text-sm">
              Deleted notes stay here for 30 days before permanent removal. You can restore a note anytime before it is permanently deleted.
            </p>
          </div>
          <ShieldAlert size={17} className="mt-1 hidden shrink-0 text-amber-600/70 dark:text-amber-400/70 sm:block" />
        </section>

        {/* Search panel */}
        {notes.length > 0 && (
          <section className="bn-glass-card mb-7 rounded-3xl border border-border/60 bg-card/55 p-3.5 shadow-sm backdrop-blur-xl sm:p-5">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search deleted notes..."
                aria-label="Search deleted notes"
                className="h-11 w-full rounded-2xl border border-border/70 bg-input/70 pl-10 pr-10 text-sm text-text-main outline-none transition placeholder:text-text-muted/80 focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent/10 hover:text-text-main"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-xs text-text-muted">
                {search
                  ? `${filteredNotes.length} matching ${filteredNotes.length === 1 ? 'note' : 'notes'}`
                  : 'Search by note title or content'}
              </p>
              <span className="text-xs font-medium text-text-muted">
                {filteredNotes.length} of {notes.length} items
              </span>
            </div>
          </section>
        )}

        {/* Deleted notes collection */}
        {notes.length === 0 ? (
          <div className="bn-glass-card rounded-3xl border border-border/60 bg-card/65 px-5 py-14 shadow-sm backdrop-blur-xl sm:py-16">
            <EmptyState
              icon={Trash2}
              title="Your trash is empty"
              description="Notes you delete will appear here. You can restore them whenever you need."
            />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bn-glass-card rounded-3xl border border-border/60 bg-card/65 px-5 py-14 text-center shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-card/80 text-text-muted">
              <Search size={20} />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-text-main">No matching notes</h2>
            <p className="mt-1 text-xs text-text-muted">
              Try another title or keyword.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch('')}
              className="mt-3"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <section>
            <div className="mb-4 flex flex-col justify-between gap-2 px-1 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight text-text-main">
                    Deleted notes
                  </h2>
                  <span className="rounded-full border border-border/70 bg-card/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-muted">
                    {filteredNotes.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  Restore notes or permanently remove the ones you no longer need.
                </p>
              </div>
              <span className="text-xs text-text-muted">
                Sorted by last updated
              </span>
            </div>

            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const isRestoring =
                  restore.isPending && restore.variables === note.id;
                const isPurging =
                  purge.isPending && purge.variables === note.id;
                const isBusy = restore.isPending || purge.isPending;

                return (
                  <article
                    key={note.id}
                    className="bn-glass-card group rounded-2xl border border-border/60 bg-card/65 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-card/80 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200/60 bg-rose-50/80 text-rose-500 dark:border-rose-900/35 dark:bg-rose-950/30 dark:text-rose-400">
                        <FileText size={19} strokeWidth={1.8} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className="max-w-full truncate text-sm font-semibold text-text-main">
                            {note.title || 'Untitled'}
                          </h3>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200/60 bg-rose-50/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:border-rose-900/35 dark:bg-rose-950/35 dark:text-rose-400">
                            <Trash2 size={10} />
                            Deleted
                          </span>
                        </div>

                        <p className="mt-1.5 line-clamp-2 break-words text-xs leading-relaxed text-text-muted">
                          {excerptFromContent(note.content) || 'This note has no content.'}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={12} />
                            Last updated {relativeTime(note.updated_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={isRestoring}
                          disabled={isBusy}
                          onClick={() => restore.mutate(note.id)}
                          className="h-9 flex-1 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-3 text-emerald-700 hover:bg-emerald-100/80 dark:border-emerald-900/35 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 sm:flex-none"
                        >
                          {!isRestoring && <RotateCcw size={14} />}
                          Restore
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          loading={isPurging}
                          disabled={isBusy}
                          onClick={() => handlePurge(note.id, note.title)}
                          className="h-9 flex-1 rounded-xl border border-rose-200/60 bg-rose-50/60 px-3 text-rose-600 hover:bg-rose-100/80 dark:border-rose-900/35 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 sm:flex-none"
                        >
                          {!isPurging && <Trash2 size={14} />}
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {notes.length > 0 && (
          <footer className="mt-8 flex flex-col items-center justify-center gap-2 border-t border-border/40 pt-5 text-center">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <Sparkles size={12} />
              <span>Keep your workspace organized</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Permanently deleted notes cannot be recovered.
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}
