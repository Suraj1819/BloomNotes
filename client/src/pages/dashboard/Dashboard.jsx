
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import {
  notesApi,
  foldersApi,
  remindersApi,
  journalApi,
} from '../../services/index.js';

import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
} from '../../components/ui/Card.jsx';

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

import lavenderBackground from '../../../assets/background/lavender.png';

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile } = useAuth();

  const firstName = (profile?.full_name || 'there').split(' ')[0];

  // Create note
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

  // Recent notes
  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', 'dashboard'],
    queryFn: () => notesApi.list({ limit: 5, sort: 'updated' }),
  });

  // Pinned notes
  const { data: pinned } = useQuery({
    queryKey: ['notes', 'pinned'],
    queryFn: () => notesApi.list({ pinned: true, limit: 4 }),
  });

  // Favorite notes
  const { data: favorites } = useQuery({
    queryKey: ['notes', 'favorites'],
    queryFn: () => notesApi.list({ favorite: true, limit: 4 }),
  });

  // Folders
  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  // Upcoming reminders
  const { data: reminders } = useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: () => remindersApi.list({ upcoming: true, limit: 4 }),
  });

  // Journal
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
      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/65 dark:bg-slate-950/65" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Welcome section */}
        <section className="mb-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-text-muted shadow-sm backdrop-blur-sm">
                <Sparkles size={13} className="text-accent" />
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
        <section className="mb-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total notes"
            value={notesData?.total || 0}
            description="Your collected thoughts"
            icon={NotebookPen}
            iconColor="text-violet-600"
            iconBg="bg-violet-500/10"
            onClick={() => navigate('/app/notes')}
          />

          <StatCard
            label="Favorites"
            value={favorites?.total || 0}
            description="Notes you love"
            icon={Star}
            iconColor="text-amber-600"
            iconBg="bg-amber-500/10"
            onClick={() => navigate('/app/favorites')}
          />

          <StatCard
            label="Pinned notes"
            value={pinned?.total || 0}
            description="Your important notes"
            icon={Pin}
            iconColor="text-rose-600"
            iconBg="bg-rose-500/10"
            onClick={() => navigate('/app/pinned')}
          />

          <StatCard
            label="Folders"
            value={folders?.length || 0}
            description="Your organized spaces"
            icon={FolderTree}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-500/10"
            onClick={() => navigate('/app/folders')}
          />
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">

          {/* Recently edited */}
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Recently edited</CardTitle>
                  <p className="mt-1 text-xs text-text-muted">
                    Pick up where you left off
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/recent')}
                >
                  See all
                  <ChevronRight size={15} />
                </Button>
              </div>
            </CardHeader>

            <CardBody className="p-0">
              {recent.length === 0 ? (
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
              ) : (
                <ul>
                  {recent.map((note) => (
                    <li key={note.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/notes/${note.id}`)}
                        className="group flex w-full min-w-0 items-center gap-3 border-b border-border/70 px-4 py-4 text-left transition-colors last:border-0 hover:bg-highlight sm:px-5"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${getThemeSwatch(note.theme_id)}18`,
                          }}
                        >
                          <FileText
                            size={18}
                            style={{
                              color: getThemeSwatch(note.theme_id),
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-medium text-text-main">
                              {note.title || 'Untitled'}
                            </p>

                            {note.is_pinned && (
                              <Pin
                                size={12}
                                className="shrink-0 text-text-muted"
                              />
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-text-muted">
                            {excerptFromContent(note.content) ||
                              note.excerpt ||
                              'No content yet'}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden whitespace-nowrap text-xs text-text-muted sm:inline">
                            {relativeTime(note.updated_at)}
                          </span>

                          <ArrowUpRight
                            size={15}
                            className="text-text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                          />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Right sidebar */}
          <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-1">

            {/* Upcoming reminders */}
            <Card className="min-w-0">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Upcoming reminders</CardTitle>
                    <p className="mt-1 text-xs text-text-muted">
                      Things to keep in mind
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                    <Clock3 size={17} className="text-amber-600" />
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-0">
                {reminderItems.length === 0 ? (
                  <div className="px-5 py-7 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-highlight">
                      <Clock3 size={17} className="text-text-muted" />
                    </div>

                    <p className="text-sm font-medium text-text-main">
                      All clear
                    </p>

                    <p className="mt-1 text-xs text-text-muted">
                      No upcoming reminders.
                    </p>
                  </div>
                ) : (
                  <ul>
                    {reminderItems.map((reminder) => (
                      <li
                        key={reminder.id}
                        className="border-b border-border/70 px-5 py-3.5 last:border-0"
                      >
                        <p className="break-words text-sm font-medium text-text-main">
                          {reminder.title}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
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
              </CardBody>
            </Card>

            {/* Journal */}
            <Card className="min-w-0">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Recent journal</CardTitle>
                    <p className="mt-1 text-xs text-text-muted">
                      Your personal reflections
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                    <BookOpen size={17} className="text-violet-600" />
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-0">
                {journalItems.length === 0 ? (
                  <div className="px-5 py-7 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-highlight">
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
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent transition-opacity hover:opacity-75"
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
                        className="border-b border-border/70 px-5 py-3.5 last:border-0"
                      >
                        <p className="break-words text-sm font-medium text-text-main">
                          {entry.title || 'Untitled entry'}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                          <CalendarDays size={12} />
                          <span>{entry.entry_date}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Bottom quick action */}
        <section className="mt-5">
          <button
            type="button"
            onClick={() => navigate('/app/vault')}
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card/80 px-5 py-4 text-left shadow-sm backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-card sm:px-6"
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

// Statistics card
function StatCard({
  label,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-2xl border border-border bg-card/85 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-xs font-medium text-text-muted sm:text-sm">
          {label}
        </span>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon size={17} className={iconColor} />
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

// Note theme colors
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
