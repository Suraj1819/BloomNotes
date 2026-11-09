import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import {
  notesApi,
  foldersApi,
  remindersApi,
  journalApi,
} from '../../services/index.js';

import { Button } from '../../components/ui/Button.jsx';
import { PageLoader, EmptyState } from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

import {
  NotebookPen,
  Star,
  Pin,
  BookOpen,
  FolderTree,
  ArrowRight,
  Plus,
  Clock3,
  CalendarDays,
  Sparkles,
  ChevronRight,
  FileText,
  ArrowUpRight,
} from 'lucide-react';

import {
  relativeTime,
  excerptFromContent,
} from '../../lib/utils.js';

import noteCardBackground from '../../../assets/background/notecard.png';

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile } = useAuth();

  const firstName = (profile?.full_name || 'there').split(' ')[0];

  const createNote = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled note' }),

    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      navigate(`/app/notes/${note.id}`);
    },

    onError: (error) => {
      toast.error(error.message || 'Could not create note');
    },
  });

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', 'dashboard'],
    queryFn: () => notesApi.list({ limit: 5, sort: 'updated' }),
  });

  const { data: pinned } = useQuery({
    queryKey: ['notes', 'pinned'],
    queryFn: () => notesApi.list({ pinned: true, limit: 4 }),
  });

  const { data: favorites } = useQuery({
    queryKey: ['notes', 'favorites'],
    queryFn: () => notesApi.list({ favorite: true, limit: 4 }),
  });

  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: () => remindersApi.list({ upcoming: true, limit: 4 }),
  });

  const { data: journal } = useQuery({
    queryKey: ['journal', 'recent'],
    queryFn: () => journalApi.list({ limit: 3 }),
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const recent = notesData?.items || [];
  const reminderItems = reminders?.items || [];
  const journalItems = journal?.items || [];

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Welcome */}
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                <Sparkles size={14} />
                Your personal workspace
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
                Good day, {firstName}.
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
                Keep your thoughts organized and make progress on what matters.
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
                <CalendarDays size={14} />
                <span>{currentDate}</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                onClick={() => createNote.mutate()}
                loading={createNote.isPending}
              >
                <Plus size={15} />
                New note
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/app/journal')}
              >
                <BookOpen size={15} />
                Journal
              </Button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total notes"
            value={notesData?.total || 0}
            description="Your collected thoughts"
            icon={NotebookPen}
            onClick={() => navigate('/app/notes')}
          />

          <StatCard
            label="Favorites"
            value={favorites?.total || 0}
            description="Your favorite notes"
            icon={Star}
            onClick={() => navigate('/app/favorites')}
          />

          <StatCard
            label="Pinned notes"
            value={pinned?.total || 0}
            description="Your important notes"
            icon={Pin}
            onClick={() => navigate('/app/pinned')}
          />

          <StatCard
            label="Folders"
            value={folders?.length || 0}
            description="Your organized spaces"
            icon={FolderTree}
            onClick={() => navigate('/app/folders')}
          />
        </section>

        {/* Recently edited */}
        <section className="mb-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-text-main sm:text-xl">
                Recently edited
              </h2>

              <p className="mt-1 text-xs text-text-muted sm:text-sm">
                Pick up where you left off
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app/recent')}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 sm:text-sm"
            >
              See all
              <ChevronRight size={15} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <EmptyState
                icon={NotebookPen}
                title="No notes yet"
                description="Create your first note and start organizing your thoughts."
                action={
                  <Button
                    onClick={() => createNote.mutate()}
                    loading={createNote.isPending}
                  >
                    <Plus size={14} />
                    Create your first note
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recent.map((note) => (
                <DashboardNoteCard
                  key={note.id}
                  note={note}
                  onClick={() => navigate(`/app/notes/${note.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Reminders and Journal */}
        <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">

          {/* Reminders */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-text-main">
                  Upcoming reminders
                </h2>

                <p className="mt-1 text-xs text-text-muted">
                  Things to keep in mind
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <Clock3 size={17} className="text-amber-600" />
              </div>
            </div>

            {reminderItems.length === 0 ? (
              <EmptyPanel
                icon={Clock3}
                title="All clear"
                description="No upcoming reminders."
              />
            ) : (
              <ul>
                {reminderItems.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="border-b border-border/70 px-5 py-4 last:border-0"
                  >
                    <p className="break-words text-sm font-medium text-text-main">
                      {reminder.title}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock3 size={12} />

                      <span>
                        {new Date(reminder.remind_at).toLocaleString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Journal */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-text-main">
                  Recent journal
                </h2>

                <p className="mt-1 text-xs text-text-muted">
                  Your personal reflections
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <BookOpen size={17} className="text-violet-600" />
              </div>
            </div>

            {journalItems.length === 0 ? (
              <div className="px-5 py-7 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-highlight">
                  <BookOpen size={17} className="text-text-muted" />
                </div>

                <p className="text-sm font-medium text-text-main">
                  Nothing written yet
                </p>

                <p className="mt-1 text-xs text-text-muted">
                  Your journal entries will appear here.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/app/journal')}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent transition-opacity hover:opacity-75"
                >
                  Open journal
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <ul>
                {journalItems.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-b border-border/70 px-5 py-4 last:border-0"
                  >
                    <p className="break-words text-sm font-medium text-text-main">
                      {entry.title || 'Untitled entry'}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                      <CalendarDays size={12} />
                      <span>{entry.entry_date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Private vault */}
        <section className="mt-5">
          <button
            type="button"
            onClick={() => navigate('/app/vault')}
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-accent/40 sm:px-6"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <FolderTree size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-main">
                  Your private vault
                </p>

                <p className="mt-1 truncate text-xs text-text-muted">
                  Keep your important files and documents in one place.
                </p>
              </div>
            </div>

            <ArrowUpRight
              size={18}
              className="shrink-0 text-text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
        </section>
      </div>
    </div>
  );
}

/* Dashboard Note Card */

function DashboardNoteCard({ note, onClick }) {
  const accent = getThemeSwatch(note.theme_id);
  const themeName = getThemeName(note.theme_id);

  const title = note.title?.trim() || 'Untitled note';

  const excerpt =
    excerptFromContent(note.content) ||
    note.excerpt ||
    'No additional content yet. Open this note to add your thoughts.';

  return (
    <article className="
  group relative isolate flex min-h-[250px]
  min-w-0 flex-col overflow-hidden
  rounded-[20px] border border-[#E8D9DE]
  bg-[#FFF8FA]
  shadow-[0_3px_14px_rgba(89,49,65,0.07)]
  transition-all duration-300 ease-out
  hover:-translate-y-1
  hover:border-[#DDBCC7]
  hover:shadow-[0_10px_24px_rgba(89,49,65,0.12)]
  dark:border-white/10 dark:bg-[#241820]
">
      

      {/* Floral notecard background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      >
        <img
          src={noteCardBackground}
          alt=""
          className="
            absolute inset-0 h-full w-full
            object-cover object-center
            opacity-[0.86]
            dark:opacity-[0.28]
          "
        />

        <div className="absolute inset-0 bg-[#FFFDFD]/55 dark:hidden" />

        <div className="absolute inset-0 hidden bg-[#241820]/75 dark:block" />

        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-white/30 dark:from-transparent dark:to-black/10" />
      </div>
      {/* Theme accent strip — right middle */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute left-0 top-[22%] z-20 h-[56%] w-[4px] rounded-l-full"
  style={{
    backgroundColor: accent,
    boxShadow: `0 0 12px ${accent}55`,
  }}
/>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col p-5">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 shadow-sm dark:border-white/10"
              style={{
                color: accent,
                backgroundColor: `${accent}18`,
              }}
            >
              <FileText size={19} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <p
                className="truncate text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: accent }}
              >
                {themeName}
              </p>

              <p className="mt-1 text-[11px] text-[#806F77] dark:text-[#C7B5BD]">
                Personal collection
              </p>
            </div>
          </div>

          {/* Pinned indicator only - three-dot menu removed */}
          {note.is_pinned && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/65 text-[#B66D86] dark:bg-white/10 dark:text-[#E8AFC3]">
              <Pin size={15} fill="currentColor" />
            </span>
          )}
        </div>

        {/* Title */}
        <button
          type="button"
          onClick={onClick}
          className="mb-3 block w-full text-left"
        >
          <h3 className="line-clamp-2 break-words text-[21px] font-semibold leading-[1.4] tracking-[-0.025em] text-[#382832] transition-colors group-hover:text-[#9D536F] dark:text-[#FFF1F5] dark:group-hover:text-[#E7AFC2]">
            {title}
          </h3>
        </button>

        {/* Preview */}
        <p className="mb-5 line-clamp-3 whitespace-pre-wrap break-words text-[13px] leading-[1.85] text-[#705D67] dark:text-[#D5C5CC]">
          {excerpt}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#E8D9DE]/80 pt-3 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-2">
            <Clock3
              size={13}
              className="shrink-0 text-[#927D87] dark:text-[#BCAAB2]"
            />

            <span className="truncate text-[11px] font-medium text-[#806D76] dark:text-[#C5B2BA]">
              {note.updated_at
                ? relativeTime(note.updated_at)
                : 'Recently created'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClick}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.98]"
            style={{ backgroundColor: accent }}
          >
            Open
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* Statistics Card */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-text-muted sm:text-sm">
          {label}
        </span>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
        {value}
      </p>

      <div className="mt-1 flex items-center justify-between gap-1">
        <p className="truncate text-[11px] text-text-muted sm:text-xs">
          {description}
        </p>

        <ArrowUpRight
          size={13}
          className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </button>
  );
}

/* Empty Panel */

function EmptyPanel({ icon: Icon, title, description }) {
  return (
    <div className="px-5 py-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-highlight">
        <Icon size={17} className="text-text-muted" />
      </div>

      <p className="text-sm font-medium text-text-main">
        {title}
      </p>

      <p className="mt-1 text-xs text-text-muted">
        {description}
      </p>
    </div>
  );
}

/* Note Theme Colors */

function getThemeSwatch(id) {
  const map = {
    sakura_pink: '#D96A91',
    lavender_garden: '#966EC8',
    botanical_garden: '#589062',
    midnight_rose: '#D982A6',
    blue_hydrangea: '#5A82C8',
    peach_blossom: '#E68264',
    daisy_minimal: '#C8AA46',
    moonlit_garden: '#96A0DC',
  };

  return map[id] || '#966EC8';
}

/* Note Theme Names */

function getThemeName(id) {
  const map = {
    sakura_pink: 'Sakura Pink',
    lavender_garden: 'Lavender Garden',
    botanical_garden: 'Botanical Garden',
    midnight_rose: 'Midnight Rose',
    blue_hydrangea: 'Blue Hydrangea',
    peach_blossom: 'Peach Blossom',
    daisy_minimal: 'Daisy Minimal',
    moonlit_garden: 'Moonlit Garden',
  };

  return map[id] || 'Personal';
}