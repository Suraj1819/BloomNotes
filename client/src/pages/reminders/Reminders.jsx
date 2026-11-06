
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { remindersApi, notesApi } from '../../services/index.js';

import { Card, CardBody } from '../../components/ui/Card.jsx';
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
} from 'lucide-react';

import lavenderBg from '../../../assets/background/lavender.png';

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

  const { data, isLoading } = useQuery({
    queryKey: ['reminders', 'all'],
    queryFn: () => remindersApi.list({ limit: 200 }),
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', 'compact'],
    queryFn: () => notesApi.list({ limit: 200 }),
  });

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    remind_at: '',
    note_id: '',
  });

  const close = () => {
    if (create.isPending) return;

    setOpen(false);
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

  const save = () => {
    if (!form.title.trim() || !form.remind_at) {
      toast.error('Title and time are required');
      return;
    }

    if (Number.isNaN(new Date(form.remind_at).getTime())) {
      toast.error('Please select a valid date and time');
      return;
    }

    create.mutate(form);
  };

  if (isLoading) return <PageLoader />;

  const items = data?.items || [];
  const now = Date.now();

  const upcoming = items.filter(
    (r) =>
      r.status === 'pending' &&
      new Date(r.remind_at).getTime() >= now
  );

  const overdue = items.filter(
    (r) =>
      r.status === 'pending' &&
      new Date(r.remind_at).getTime() < now
  );

  const done = items.filter((r) => r.status === 'done');

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
      <div className="pointer-events-none absolute inset-0 bg-white/55 dark:bg-black/45" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] dark:bg-purple-950/50 dark:text-purple-400">
              <Bell size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#10123D] dark:text-slate-100 sm:text-3xl">
                Reminders
              </h1>

              <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
                Keep track of important tasks and upcoming events.
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-[#E8D8FF] bg-white/70 px-2.5 py-1 font-medium text-[#7052B5] dark:border-white/10 dark:bg-gray-900/60 dark:text-purple-300">
                  {upcoming.length} upcoming
                </span>

                <span className="rounded-full border border-red-200 bg-red-50/80 px-2.5 py-1 font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {overdue.length} overdue
                </span>

                <span className="rounded-full border border-green-200 bg-green-50/80 px-2.5 py-1 font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
                  {done.length} completed
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setOpen(true)}
            className="self-start sm:self-auto"
          >
            <Plus size={16} />
            New reminder
          </Button>
        </div>

        {/* Sections */}
        <div className="space-y-7">
          <Section
            title="Overdue"
            subtitle="Reminders that need your attention"
            icon={AlertCircle}
            iconClass="text-red-500"
            color="red"
            items={overdue}
            onDone={(r) =>
              update.mutate({
                id: r.id,
                b: { status: 'done' },
              })
            }
            onDelete={(r) => remove.mutate(r.id)}
            empty="Nothing overdue. You're all caught up."
            updatePending={update.isPending}
            deletePending={remove.isPending}
          />

          <Section
            title="Upcoming"
            subtitle="Things you need to remember"
            icon={Clock}
            iconClass="text-[#7652C8]"
            color="purple"
            items={upcoming}
            onDone={(r) =>
              update.mutate({
                id: r.id,
                b: { status: 'done' },
              })
            }
            onDelete={(r) => remove.mutate(r.id)}
            empty="No upcoming reminders. Create one to stay organized."
            updatePending={update.isPending}
            deletePending={remove.isPending}
          />

          <Section
            title="Completed"
            subtitle="Your finished reminders"
            icon={Check}
            iconClass="text-green-600"
            color="green"
            items={done}
            onDelete={(r) => remove.mutate(r.id)}
            empty="Completed reminders will appear here."
            deletePending={remove.isPending}
          />
        </div>
      </div>

      {/* Create reminder dialog */}
      <Dialog
        open={open}
        onClose={close}
        title="New reminder"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={close}
              disabled={create.isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={save}
              disabled={create.isPending}
              loading={create.isPending}
            >
              Create reminder
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8D8FF] bg-[#F8F4FF]/80 p-4 dark:border-purple-400/15 dark:bg-purple-950/25">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#7652C8] shadow-sm dark:bg-slate-800 dark:text-purple-300">
                <CalendarClock size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#35265D] dark:text-slate-100">
                  Plan your next task
                </p>

                <p className="mt-0.5 text-xs text-[#766A91] dark:text-slate-400">
                  Set a time and keep important things on track.
                </p>
              </div>
            </div>
          </div>

          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              placeholder="Water the garden"
              maxLength={150}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date and time">
              <Input
                type="datetime-local"
                value={form.remind_at}
                onChange={(e) =>
                  setForm({ ...form, remind_at: e.target.value })
                }
                min={toLocalInput(new Date().toISOString())}
              />
            </Field>

            <Field label="Link to note (optional)">
              <Select
                value={form.note_id}
                onChange={(e) =>
                  setForm({ ...form, note_id: e.target.value })
                }
              >
                <option value="">No note</option>

                {(notes?.items || []).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Description (optional)">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Add some details..."
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  iconClass = 'text-[#7652C8]',
  color = 'purple',
  items,
  onDone,
  onDelete,
  empty,
  updatePending = false,
  deletePending = false,
}) {
  const styles = {
    purple: {
      iconBg: 'bg-[#F1E8FF] dark:bg-purple-950/50',
      count: 'border-[#E8D8FF] bg-white/70 text-[#7052B5] dark:border-white/10 dark:bg-gray-900/60 dark:text-purple-300',
      accent: 'border-l-[#A78BFA]',
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
    <section>
      <div className="mb-4 flex items-center gap-3 border-b border-[#E8D8FF] pb-3 dark:border-slate-700">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}>
          <Icon size={17} className={iconClass} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#10123D] dark:text-slate-100">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-[#51418F] dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <span className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-semibold ${style.count}`}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#DCCCF5] bg-white/45 px-5 py-9 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-900/30">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800">
            <Icon size={18} className={iconClass} />
          </div>

          <p className="text-sm text-[#766A91] dark:text-slate-400">
            {empty}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              color={color}
              accent={style.accent}
              onDone={onDone}
              onDelete={onDelete}
              updatePending={updatePending}
              deletePending={deletePending}
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
  onDelete,
  updatePending,
  deletePending,
}) {
  const isOverdue = color === 'red';
  const isDone = color === 'green';

  return (
    <article
      className={`group relative isolate flex min-h-[205px] flex-col overflow-hidden rounded-[22px] border border-l-[3px] ${accent} border-[#E8D8FF] bg-white/80 shadow-[0_4px_12px_rgba(91,55,150,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#CDA8FF] hover:shadow-[0_12px_28px_rgba(91,55,150,0.14)] dark:border-slate-700 dark:bg-slate-900/75 dark:hover:border-purple-400/40`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-purple-100/40 blur-3xl dark:bg-purple-500/10" />

      <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">

        {/* Card header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            isOverdue
              ? 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300'
              : isDone
                ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300'
                : 'bg-[#F1E8FF] text-[#7652C8] dark:bg-purple-950/50 dark:text-purple-300'
          }`}>
            {isDone ? <Check size={20} /> : <CalendarClock size={20} />}
          </div>

          <div className="flex items-center gap-1">
            {onDone && (
              <button
                type="button"
                onClick={() => onDone(reminder)}
                disabled={updatePending}
                title="Mark as done"
                aria-label="Mark as done"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-green-600 transition hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-950/40"
              >
                <Check size={17} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(reminder)}
              disabled={deletePending}
              title="Delete reminder"
              aria-label="Delete reminder"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8A7DA4] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 break-words text-base font-bold leading-snug text-[#10123D] dark:text-slate-100">
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
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#51418F] dark:text-slate-300">
          {reminder.description || 'A reminder to keep an important moment on track.'}
        </p>

        {/* Footer */}
        <div className="mt-auto space-y-3 border-t border-[#EDE2FA] pt-3 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F6F1FF] text-[#7652C8] dark:bg-purple-950/40 dark:text-purple-300">
              <CalendarDays size={15} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#9385AE] dark:text-slate-500">
                Scheduled for
              </p>

              <p className="truncate text-xs font-semibold text-[#51418F] dark:text-slate-300">
                {formatReminderDate(reminder.remind_at)}
              </p>
            </div>
          </div>

          {reminder.note_id && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#7652C8] dark:text-purple-300">
              <FileText size={13} />
              Linked note
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
