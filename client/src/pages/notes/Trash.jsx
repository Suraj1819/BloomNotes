
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
} from 'lucide-react';

import {
  relativeTime,
  excerptFromContent,
} from '../../lib/utils.js';

import lavenderBg from '../../../assets/background/fav.png';

export default function Trash() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  const {
    data,
    isLoading,
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

  if (isLoading) {
    return <PageLoader />;
  }

  const notes = data?.items || [];

  return (
    <div
      className="relative isolate min-h-full overflow-hidden"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/40 dark:bg-slate-950/10" />

      {/* Main content */}
      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Header */}
        <section className="mb-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-200/70 bg-rose-100/80 dark:border-rose-900/40 dark:bg-rose-950/40">
                <Trash2
                  size={22}
                  className="text-rose-600 dark:text-rose-400"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
                    Trash
                  </h1>

                  <span className="rounded-full border border-rose-200/70 bg-rose-50/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
                    Deleted items
                  </span>
                </div>

                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  Manage deleted notes and restore them whenever you need.
                </p>
              </div>
            </div>

            {/* Notes count */}
            <div className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-card/80 px-4 py-2.5 shadow-sm backdrop-blur-sm sm:self-auto">
              <FileText size={15} className="text-text-muted" />

              <span className="text-sm font-medium text-text-main">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
          </div>
        </section>

        {/* Retention information */}
        <section className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 sm:px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle
              size={17}
              className="text-amber-600 dark:text-amber-400"
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Notes in Trash
            </p>

            <p className="mt-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-200/70 sm:text-sm">
              Deleted notes stay here for 30 days before permanent removal.
              You can restore a note anytime before it is permanently deleted.
            </p>
          </div>
        </section>

        {/* Empty state */}
        {notes.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card/80 px-5 py-14 shadow-sm backdrop-blur-sm sm:py-16">
            <EmptyState
              icon={Trash2}
              title="Your trash is empty"
              description="Notes you delete will appear here. You can restore them whenever you need."
            />
          </div>
        ) : (

          /* Notes list */
          <section className="space-y-3">

            {/* List heading */}
            <div className="flex items-center justify-between px-1 pb-1">
              <div>
                <h2 className="text-sm font-semibold text-text-main">
                  Deleted notes
                </h2>

                <p className="mt-0.5 text-xs text-text-muted">
                  Restore or permanently remove your notes.
                </p>
              </div>

              <span className="text-xs text-text-muted">
                {notes.length} items
              </span>
            </div>

            {notes.map((note) => {
              const isRestoring =
                restore.isPending && restore.variables === note.id;

              const isPurging =
                purge.isPending && purge.variables === note.id;

              const isBusy = restore.isPending || purge.isPending;

              return (
                <article
                  key={note.id}
                  className="group rounded-2xl border border-border bg-card/85 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">

                    {/* Note icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/30">
                      <FileText
                        size={19}
                        className="text-rose-500 dark:text-rose-400"
                      />
                    </div>

                    {/* Note information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="max-w-full truncate text-sm font-semibold text-text-main">
                          {note.title || 'Untitled'}
                        </h3>

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                          <Trash2 size={10} />
                          Deleted
                        </span>
                      </div>

                      <p className="mt-1.5 line-clamp-2 break-words text-xs leading-relaxed text-text-muted">
                        {excerptFromContent(note.content) ||
                          'This note has no content.'}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={12} />
                          Last updated {relativeTime(note.updated_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2 border-t border-border/70 pt-3 sm:border-0 sm:pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={isRestoring}
                        disabled={isBusy}
                        onClick={() => restore.mutate(note.id)}
                        className="flex-1 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 sm:flex-none"
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
                        className="flex-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 sm:flex-none"
                      >
                        {!isPurging && <Trash2 size={14} />}
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Footer information */}
        {notes.length > 0 && (
          <footer className="mt-7 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Sparkles size={12} />
              <span>Keep your workspace organized</span>
            </div>

            <p className="text-[11px] text-text-muted">
              Permanently deleted notes cannot be recovered.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
