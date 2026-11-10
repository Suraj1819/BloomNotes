
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { remindersApi, notesApi } from '../../services/index.js';

import { Button } from '../../components/ui/Button.jsx';
import { Input, Textarea, Field } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';

import {
  Bell,
  Plus,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  CalendarClock,
  FileText,
  CalendarDays,
  Pencil,
  X,
  RefreshCw,
  Loader2,
  Search,
  Sparkles,
  AlarmClock,
  CalendarCheck2,
  Link2,
} from 'lucide-react';

import favvBg from '../../../assets/background/fav4.png';

function toLocalInput(iso) {
  if (!iso) return '';

  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);

  return local.toISOString().slice(0, 16);
}

function formatReminderDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Reminders() {
  const qc = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reminders', 'all'],
    queryFn: () => remindersApi.list({ limit: 200 }),
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', 'compact'],
    queryFn: () => notesApi.list({ limit: 200 }),
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    remind_at: '',
    note_id: '',
  });

  const close = () => {
    if (create.isPending || update.isPending) return;

    setOpen(false);
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      remind_at: '',
      note_id: '',
    });
  };

  const create = useMutation({
    mutationFn: (b) =>
      remindersApi.create({
        ...b,
        note_id: b.note_id || null,
        remind_at: new Date(b.remind_at).toISOString(),
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      setOpen(false);

      setForm({
        title: '',
        description: '',
        remind_at: '',
        note_id: '',
      });

      toast.success('Reminder created');
    },

    onError: (error) => {
      toast.error(error.message || 'Failed to create reminder');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, b }) => remindersApi.update(id, b),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder updated');
    },

    onError: (error) => {
      toast.error(error.message || 'Failed to update reminder');
    },
  });

  const remove = useMutation({
    mutationFn: (id) => remindersApi.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder deleted');
    },

    onError: (error) => {
      toast.error(error.message || 'Failed to delete reminder');
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      remind_at: '',
      note_id: '',
    });
    setOpen(true);
  };

  const openEdit = (reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title || '',
      description: reminder.description || '',
      remind_at: toLocalInput(reminder.remind_at),
      note_id: reminder.note_id || '',
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.title.trim() || !form.remind_at) {
      toast.error('Title and time are required');
      return;
    }

    if (Number.isNaN(new Date(form.remind_at).getTime())) {
      toast.error('Please select a valid date and time');
      return;
    }

    const payload = {
      ...form,
      note_id: form.note_id || null,
      remind_at: new Date(form.remind_at).toISOString(),
    };

    if (editingId) {
      update.mutate(
        { id: editingId, b: payload },
        {
          onSuccess: () => {
            setOpen(false);
            setEditingId(null);
            setForm({
              title: '',
              description: '',
              remind_at: '',
              note_id: '',
            });
          },
        }
      );
    } else {
      create.mutate(form);
    }
  };

  if (isLoading) return <PageLoader />;

  const items = data?.items || [];
  const now = Date.now();

  const matchesSearch = (r) => {
    const q = search.trim().toLowerCase();

    return (
      !q ||
      `${r.title || ''} ${r.description || ''}`
        .toLowerCase()
        .includes(q)
    );
  };

  const upcoming = items.filter(
    (r) =>
      r.status === 'pending' &&
      new Date(r.remind_at).getTime() >= now &&
      matchesSearch(r)
  );

  const overdue = items.filter(
    (r) =>
      r.status === 'pending' &&
      new Date(r.remind_at).getTime() < now &&
      matchesSearch(r)
  );

  const done = items.filter(
    (r) => r.status === 'done' && matchesSearch(r)
  );

  const totalPending = items.filter(
    (r) => r.status === 'pending'
  ).length;

  const sortByReminderDate = (list) =>
    [...list].sort(
      (a, b) =>
        new Date(a.remind_at).getTime() -
        new Date(b.remind_at).getTime()
    );

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const selectedNote = (notes?.items || []).find(
    (n) => n.id === form.note_id
  );

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${favvBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80"
      />

      <main className="relative mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">

        {/* Header */}
        <header className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
              <Bell size={23} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                  Reminders
                </h1>

                <span className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {totalPending} active
                </span>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                Stay on top of tasks, important dates and everything you plan to do.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-10 rounded-xl border-border/70 bg-card/70 px-3 backdrop-blur-xl"
            >
              <RefreshCw
                size={14}
                className={isFetching ? 'animate-spin' : ''}
              />
              Refresh
            </Button>

            <Button
              onClick={openCreate}
              className="h-10 rounded-xl px-4 shadow-sm"
            >
              <Plus size={16} />
              New reminder
            </Button>
          </div>
        </header>

        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        {/* Statistics */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Upcoming"
            value={upcoming.length}
            icon={Clock}
            tone="rose"
            detail="Scheduled reminders"
            onClick={() => scrollToSection('upcoming-reminders')}
          />

          <StatCard
            label="Overdue"
            value={overdue.length}
            icon={AlertCircle}
            tone="red"
            detail="Need your attention"
            onClick={() => scrollToSection('overdue-reminders')}
          />

          <StatCard
            label="Completed"
            value={done.length}
            icon={Check}
            tone="green"
            detail="Successfully finished"
            onClick={() => scrollToSection('completed-reminders')}
          />
        </section>

        {/* Search */}
        <section className="bn-glass-card mb-7 rounded-3xl border border-border/60 bg-card/55 p-3.5 shadow-sm backdrop-blur-xl sm:p-5">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reminders by title or description..."
              aria-label="Search reminders"
              className="h-11 w-full rounded-2xl border border-border/70 bg-input/70 pl-10 pr-10 text-sm text-text-main outline-none transition placeholder:text-text-muted/80 focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted hover:bg-accent/10"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-text-muted">
            <span>
              {search ? 'Filtered reminders' : 'Your reminder overview'}
            </span>

            <span>
              {upcoming.length + overdue.length + done.length} of {items.length} reminders
            </span>
          </div>
        </section>

        {/* Reminder Sections */}
        <div className="space-y-8">
          <Section
            id="upcoming-reminders"
            title="Upcoming"
            subtitle="Your next tasks and scheduled events"
            icon={Clock}
            iconClass="text-accent"
            color="rose"
            items={sortByReminderDate(upcoming)}
            onDone={(r) =>
              update.mutate({
                id: r.id,
                b: { status: 'done' },
              })
            }
            onEdit={openEdit}
            onDelete={(r) => remove.mutate(r.id)}
            empty="No upcoming reminders. Create one to stay organized."
            updatePendingId={update.isPending ? update.variables?.id : null}
            deletePendingId={remove.isPending ? remove.variables : null}
          />

          <Section
            id="overdue-reminders"
            title="Overdue"
            subtitle="Reminders that need your attention"
            icon={AlertCircle}
            iconClass="text-red-500"
            color="red"
            items={sortByReminderDate(overdue)}
            onDone={(r) =>
              update.mutate({
                id: r.id,
                b: { status: 'done' },
              })
            }
            onEdit={openEdit}
            onDelete={(r) => remove.mutate(r.id)}
            empty="Nothing overdue. You're all caught up."
            updatePendingId={update.isPending ? update.variables?.id : null}
            deletePendingId={remove.isPending ? remove.variables : null}
          />

          <Section
            id="completed-reminders"
            title="Completed"
            subtitle="A record of the reminders you've finished"
            icon={Check}
            iconClass="text-green-600"
            color="green"
            items={[...done].sort(
              (a, b) =>
                new Date(b.remind_at).getTime() -
                new Date(a.remind_at).getTime()
            )}
            onEdit={openEdit}
            onDelete={(r) => remove.mutate(r.id)}
            empty="Completed reminders will appear here."
            deletePendingId={remove.isPending ? remove.variables : null}
          />
        </div>

        <footer className="mt-9 flex flex-col items-center gap-2 border-t border-border/40 pt-5 text-center">
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <Sparkles size={12} />
            <span>A little planning makes every day smoother</span>
          </div>
        </footer>
      </main>

      {/* Create / Edit Dialog */}
      <Dialog
        open={open}
        onClose={close}
        title={editingId ? 'Edit reminder' : 'Create a reminder'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={close}
              disabled={create.isPending || update.isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={save}
              disabled={create.isPending || update.isPending}
              loading={create.isPending || update.isPending}
            >
              {editingId ? 'Save changes' : 'Create reminder'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">

          {/* Dialog Intro */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-accent/10 via-card/75 to-card/50 p-4 sm:p-5">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/80 text-accent shadow-sm">
                <AlarmClock size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main">
                  {editingId
                    ? 'Make your reminder more precise'
                    : 'Make time for what matters'}
                </p>

                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Add a clear title, choose the exact date and time, and optionally connect a note for context.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Reminder details
                </label>

                <span className="text-[11px] text-text-muted">
                  * Required fields
                </span>
              </div>

              <Field label="Title *">
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="e.g. Submit assignment, call someone..."
                  maxLength={150}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date and time *">
                <Input
                  type="datetime-local"
                  value={form.remind_at}
                  onChange={(e) =>
                    setForm({ ...form, remind_at: e.target.value })
                  }
                  min={
                    editingId
                      ? undefined
                      : toLocalInput(new Date().toISOString())
                  }
                />
              </Field>

              <Field label="Connect a note">
                <Select
                  value={form.note_id}
                  onChange={(e) =>
                    setForm({ ...form, note_id: e.target.value })
                  }
                >
                  <option value="">No linked note</option>

                  {(notes?.items || []).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title || 'Untitled note'}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Add useful details, a short checklist, or context for this reminder..."
              />
            </Field>
          </div>

          {/* Live Preview */}
          <div className="rounded-2xl border border-border/60 bg-card/55 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                <Sparkles size={12} className="text-accent" />
                Live preview
              </div>

              <span className="rounded-full border border-border/60 bg-card/70 px-2 py-1 text-[10px] font-medium text-text-muted">
                Preview
              </span>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/70 p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CalendarCheck2 size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-text-main">
                    {form.title.trim() || 'Your reminder title'}
                  </p>

                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                    <CalendarDays size={13} />
                    <span>
                      {form.remind_at
                        ? formatReminderDate(
                            new Date(form.remind_at).toISOString()
                          )
                        : 'Choose a date and time'}
                    </span>
                  </div>

                  {form.description.trim() ? (
                    <p className="mt-2 line-clamp-3 break-words text-xs leading-relaxed text-text-muted">
                      {form.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs italic text-text-muted/70">
                      Your description will appear here.
                    </p>
                  )}

                  {form.note_id && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent">
                      <Link2 size={12} />
                      {selectedNote?.title || 'Note linked'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone, detail, onClick }) {
  const tones = {
    rose: 'bg-accent/10 text-accent border-accent/15',
    red: 'bg-red-500/10 text-red-600 border-red-500/15 dark:text-red-400',
    green: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/15 dark:text-emerald-400',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="bn-glass-card flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/65 p-4 text-left shadow-sm backdrop-blur-xl transition-colors hover:border-accent/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:p-5"
      aria-label={`Jump to ${label} reminders`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">
          {label}
        </p>

        <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-text-main">
          {value}
        </p>

        <p className="mt-0.5 truncate text-[11px] text-text-muted">
          {detail}
        </p>
      </div>
    </button>
  );
}

function Section({
  id,
  title,
  subtitle,
  icon: Icon,
  iconClass = 'text-[#B85C78]',
  color = 'rose',
  items,
  onDone,
  onEdit,
  onDelete,
  empty,
  updatePendingId = null,
  deletePendingId = null,
}) {
  const styles = {
    rose: {
      iconBg: 'bg-[#F9E8EE] dark:bg-rose-950/45',
      count: 'border-[#F0D7E0] bg-white/75 text-[#A65370] dark:border-rose-300/15 dark:bg-[#2A1A22]/75 dark:text-rose-200',
      accent: 'border-l-[#C77C93]',
    },

    red: {
      iconBg: 'bg-red-50 dark:bg-red-950/40',
      count: 'border-red-200 bg-red-50/80 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
      accent: 'border-l-red-400',
    },

    green: {
      iconBg: 'bg-green-50 dark:bg-green-950/40',
      count: 'border-green-200 bg-green-50/80 text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300',
      accent: 'border-l-green-500',
    },
  };

  const style = styles[color];

  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}>
          <Icon size={17} className={iconClass} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-text-main">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-text-muted">
            {subtitle}
          </p>
        </div>

        <span className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-semibold ${style.count}`}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-border/70 bg-card/45 px-5 py-9 text-center backdrop-blur-md dark:border-border/40 dark:bg-card/30">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800">
            <Icon size={18} className={iconClass} />
          </div>

          <p className="text-sm text-text-muted">
            {empty}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              color={color}
              accent={style.accent}
              onDone={onDone}
              onEdit={onEdit}
              onDelete={onDelete}
              updatePending={updatePendingId === r.id}
              deletePending={deletePendingId === r.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReminderCard({
  reminder,
  color,
  accent,
  onDone,
  onEdit,
  onDelete,
  updatePending,
  deletePending,
}) {
  const isOverdue = color === 'red';
  const isDone = color === 'green';

  return (
    <article
      className={`group relative isolate flex min-h-[245px] flex-col overflow-hidden rounded-[26px] border border-l-[3px] ${accent} border-border/70 bg-card/75 shadow-sm backdrop-blur-2xl dark:border-border/70 dark:bg-card/80 dark:shadow-black/20`}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl dark:bg-rose-400/10" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/20" />

      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">

        {/* Card Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isOverdue
                ? 'border border-red-500/15 bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                : isDone
                  ? 'border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'border border-accent/15 bg-accent/10 text-accent'
            }`}
          >
            {isDone ? <Check size={20} /> : <CalendarClock size={20} />}
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(reminder)}
                title="Edit reminder"
                aria-label="Edit reminder"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/90 text-text-main shadow-sm backdrop-blur-md transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-accent/15" 
              >
                <Pencil size={16} />
              </button>
            )}

            {onDone && (
              <button
                type="button"
                onClick={() => onDone(reminder)}
                disabled={updatePending}
                title="Mark as done"
                aria-label="Mark as done"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 shadow-sm backdrop-blur-md transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20" 
              >
                {updatePending ? (
                  <Loader2 size={17} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Check size={17} />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(reminder)}
              disabled={deletePending}
              title="Delete reminder"
              aria-label="Delete reminder"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 shadow-sm backdrop-blur-md transition-colors hover:border-red-500/40 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20" 
            >
              {deletePending ? (
                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 break-words text-base font-bold leading-snug tracking-tight text-text-main">
            {reminder.title || 'Untitled reminder'}
          </h3>

          {isOverdue && (
            <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">
              Overdue
            </span>
          )}

          {isDone && (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
              Completed
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mb-5 line-clamp-3 text-[13px] leading-6 text-text-muted">
          {reminder.description || 'A reminder to keep an important moment on track.'}
        </p>

        {/* Footer */}
        <div className="mt-auto space-y-3 border-t border-border/70 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <CalendarDays size={15} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                Scheduled for
              </p>

              <p className="truncate text-xs font-semibold text-text-main">
                {formatReminderDate(reminder.remind_at)}
              </p>
            </div>
          </div>

          {reminder.note_id && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
              <FileText size={13} />
              Linked note
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
