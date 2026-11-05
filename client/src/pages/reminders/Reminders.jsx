// src/pages/reminders/Reminders.jsx
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
} from 'lucide-react';

import lavenderBg from '../../../assets/background/lavender.png';

function toLocalInput(iso) {
  if (!iso) return '';

  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);

  return local.toISOString().slice(0, 16);
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
      close();
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
      toast.success('Deleted');
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
      className="relative min-h-full"
      style={{ fontFamily: 'Calibri, sans-serif' }}
    >
      {/* Lavender background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${lavenderBg})` }}
      />

      <div className="fixed inset-0 -z-10 bg-white/25 dark:bg-black/25" />

      <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E8D8FF] bg-white/80 shadow-sm dark:border-white/10 dark:bg-gray-900/80">
              <Bell size={21} className="text-[#7652C8]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#252044] dark:text-white">
                Reminders
              </h1>

              <p className="mt-1 text-sm text-[#655A85] dark:text-gray-300">
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
            className="shrink-0"
          >
            <Plus size={15} />
            New reminder
          </Button>
        </div>

        {/* Reminder sections */}
        <div className="space-y-7">
          <Section
            title="Overdue"
            subtitle="Reminders that need your attention"
            icon={AlertCircle}
            iconClass="text-red-500"
            items={overdue}
            onDone={(r) =>
              update.mutate({
                id: r.id,
                b: { status: 'done' },
              })
            }
            onDelete={(r) => remove.mutate(r.id)}
            empty="Nothing overdue. You're all caught up."
          />

          <Section
            title="Upcoming"
            subtitle="Things you need to remember"
            icon={Clock}
            iconClass="text-[#7652C8]"
            items={upcoming}
            onDone={(r) =>
              update.mutate({
                id: r.id,
                b: { status: 'done' },
              })
            }
            onDelete={(r) => remove.mutate(r.id)}
            empty="No upcoming reminders. Create one to stay organized."
          />

          <Section
            title="Completed"
            subtitle="Your finished reminders"
            icon={Check}
            iconClass="text-green-600"
            items={done}
            onDelete={(r) => remove.mutate(r.id)}
            empty="Completed reminders will appear here."
          />
        </div>

        {/* Create reminder dialog */}
        <Dialog
          open={open}
          onClose={close}
          title="New reminder"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={close}>
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
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Water the garden"
              />
            </Field>

            <Field label="When">
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
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  iconClass = 'text-[#7652C8]',
  items,
  onDone,
  onDelete,
  empty,
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8D8FF] bg-white/75 dark:border-white/10 dark:bg-gray-900/70">
          <Icon size={17} className={iconClass} />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#252044] dark:text-white">
            {title}
          </h2>

          <p className="text-xs text-[#766A91] dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        <span className="ml-auto rounded-full border border-[#E8D8FF] bg-white/70 px-2.5 py-1 text-xs font-semibold text-[#7052B5] dark:border-white/10 dark:bg-gray-900/60 dark:text-purple-300">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCCCF5] bg-white/45 px-5 py-7 text-center dark:border-white/10 dark:bg-gray-900/30">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800">
            <Icon size={17} className={iconClass} />
          </div>

          <p className="text-sm text-[#766A91] dark:text-gray-400">
            {empty}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <Card
              key={r.id}
              className="border border-[#E8D8FF] bg-white/85 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-gray-900/80"
            >
              <CardBody className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2ECFF] dark:bg-purple-950/50">
                  <CalendarClock
                    size={18}
                    className="text-[#7652C8] dark:text-purple-300"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#252044] dark:text-white">
                    {r.title}
                  </p>

                  {r.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[#766A91] dark:text-gray-400">
                      {r.description}
                    </p>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-[#766A91] dark:text-gray-400">
                      <Clock size={12} />
                      {new Date(r.remind_at).toLocaleString()}
                    </span>

                    {r.note_id && (
                      <span className="flex items-center gap-1 text-xs text-[#7652C8] dark:text-purple-300">
                        <FileText size={12} />
                        Linked note
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {onDone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDone(r)}
                      aria-label="Mark as done"
                      title="Mark as done"
                      disabled={false}
                    >
                      <Check size={16} className="text-green-600" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(r)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    aria-label="Delete reminder"
                    title="Delete reminder"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}