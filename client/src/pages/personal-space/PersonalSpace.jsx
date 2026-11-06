
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { personalSpaceApi } from '../../services/index.js';

import { Button } from '../../components/ui/Button.jsx';
import { Input, Textarea, Field } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { PageLoader, EmptyState } from '../../components/ui/Spinner.jsx';

import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Pin,
  Link as LinkIcon,
  ListChecks,
  FileText,
  Code,
  Clock3,
  MoreVertical,
} from 'lucide-react';

import { relativeTime, cn } from '../../lib/utils.js';
import { useConfirm, usePrompt } from '../../contexts/ConfirmContext.jsx';

import lavenderBg from '../../../assets/background/lavender.png';
import noteFlower from '../../../assets/background/note-card-flower.png';

const KIND_META = {
  note: { label: 'Note', icon: FileText },
  checklist: { label: 'Checklist', icon: ListChecks },
  link: { label: 'Link', icon: LinkIcon },
  snippet: { label: 'Snippet', icon: Code },
};

export default function PersonalSpace() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const { data: cats } = useQuery({
    queryKey: ['ps-cats'],
    queryFn: () => personalSpaceApi.listCategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ps-entries'],
    queryFn: () => personalSpaceApi.listEntries({ limit: 200 }),
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    kind: 'note',
    title: '',
    content: '',
    category_id: '',
    is_pinned: false,
  });

  const close = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm({
      kind: 'note',
      title: '',
      content: '',
      category_id: '',
      is_pinned: false,
    });
  };

  const create = useMutation({
    mutationFn: (body) => personalSpaceApi.createEntry(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      close();
      toast.success('Created');
    },
    onError: (error) => toast.error(error.message || 'Could not create entry'),
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => personalSpaceApi.updateEntry(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      close();
      toast.success('Updated');
    },
    onError: (error) => toast.error(error.message || 'Could not update entry'),
  });

  const remove = useMutation({
    mutationFn: (id) => personalSpaceApi.removeEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      toast.success('Deleted');
    },
    onError: (error) => toast.error(error.message || 'Could not delete entry'),
  });

  const pin = useMutation({
    mutationFn: ({ id, val }) =>
      personalSpaceApi.updateEntry(id, { is_pinned: val }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      toast.success(variables.val ? 'Entry pinned' : 'Entry unpinned');
    },
    onError: (error) => toast.error(error.message || 'Could not update pin'),
  });

  const createCat = useMutation({
    mutationFn: (body) => personalSpaceApi.createCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-cats'] });
      toast.success('Category created');
    },
    onError: (error) => toast.error(error.message || 'Could not create category'),
  });

  const handleRemove = async (entry) => {
    const ok = await confirm({
      title: 'Delete entry?',
      description: `"${entry.title || entry.kind}" will be permanently deleted.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (ok) remove.mutate(entry.id);
  };

  const handleNewCategory = async () => {
    const name = await prompt({
      title: 'New category',
      description: 'Give your new personal-space category a name.',
      placeholder: 'e.g. Recipes',
      confirmText: 'Create',
    });

    if (name) createCat.mutate({ name });
  };

  const open = (entry) => {
    if (entry) {
      setEditing(entry);
      setForm({
        kind: entry.kind,
        title: entry.title || '',
        content: entry.content || '',
        category_id: entry.category_id || '',
        is_pinned: entry.is_pinned,
      });
    } else {
      setEditing(null);
      setForm({
        kind: 'note',
        title: '',
        content: '',
        category_id: '',
        is_pinned: false,
      });
    }

    setEditorOpen(true);
  };

  const save = () => {
    const body = {
      ...form,
      category_id: form.category_id || null,
    };

    if (editing) {
      update.mutate({ id: editing.id, body });
    } else {
      create.mutate(body);
    }
  };

  if (isLoading) return <PageLoader />;

  const entries = data?.items || [];
  const isSaving = create.isPending || update.isPending;

  return (
    <div
      className="relative isolate min-h-full overflow-hidden"
      style={{
        backgroundImage: `url(${lavenderBg})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/20 dark:bg-black/30" />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-gray-900/60">
              <Sparkles size={20} className="text-[#7652C8] dark:text-purple-300" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#252044] dark:text-white">
                Personal Space
              </h1>

              <p className="mt-0.5 text-sm text-[#766A91] dark:text-gray-300">
                Your private collection of notes, links and ideas.
              </p>
            </div>
          </div>

          <Button onClick={() => open()}>
            <Plus size={15} />
            New entry
          </Button>
        </div>

        {/* Entry Summary */}
        {entries.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#6240C8] shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-gray-900/50 dark:text-purple-300">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>

            <span className="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-medium text-[#766A91] shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-gray-900/50 dark:text-gray-300">
              {entries.filter((entry) => entry.is_pinned).length} pinned
            </span>
          </div>
        )}

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-gray-900/50">
            <EmptyState
              icon={Sparkles}
              title="Empty personal space"
              description="Save quick notes, useful links, checklists and code snippets here."
              action={
                <Button onClick={() => open()}>
                  <Plus size={14} />
                  New entry
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => {
              const Meta = KIND_META[entry.kind] || KIND_META.note;
              const KindIcon = Meta.icon;

              const isPinning =
                pin.isPending && pin.variables?.id === entry.id;

              const isDeleting =
                remove.isPending && remove.variables === entry.id;

              return (
                <article
                  key={entry.id}
                  className={cn(
                    'group relative isolate flex min-h-[235px] flex-col',
                    'overflow-hidden rounded-[22px]',
                    'border border-white/70 bg-white/75',
                    'shadow-[0_4px_14px_rgba(91,55,150,0.08)]',
                    'transition-all duration-300',
                    'hover:-translate-y-1 hover:border-[#CDA8FF]',
                    'hover:shadow-[0_12px_28px_rgba(91,55,150,0.15)]',
                    'dark:border-slate-700 dark:bg-slate-900/80'
                  )}
                >
                  {/* Floral Image */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1 -right-1 z-0 h-[82%] w-[48%] bg-contain bg-right-bottom bg-no-repeat opacity-85 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${noteFlower})`,
                    }}
                  />

                  {/* Readability Overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-white via-white/95 to-white/10 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/30"
                  />

                  <div className="relative z-10 flex min-h-[235px] flex-1 flex-col p-4 sm:p-5">

                    {/* Card Header */}
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8D8FF] bg-white/75 text-[#7652C8] shadow-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-purple-300">
                          <KindIcon size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-[#6240C8] dark:text-purple-300">
                            {Meta.label}
                          </p>
                          <p className="text-[11px] text-[#9387A8] dark:text-gray-400">
                            Personal collection
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {entry.is_pinned && (
                          <span
                            title="Pinned"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E8FF] text-[#7652C8] dark:bg-purple-950/60 dark:text-purple-300"
                          >
                            <Pin size={14} fill="currentColor" />
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={isPinning}
                          onClick={() =>
                            pin.mutate({
                              id: entry.id,
                              val: !entry.is_pinned,
                            })
                          }
                          title={entry.is_pinned ? 'Unpin' : 'Pin'}
                          aria-label={entry.is_pinned ? 'Unpin entry' : 'Pin entry'}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                            'hover:bg-[#F1E8FF] disabled:opacity-50 dark:hover:bg-white/10',
                            entry.is_pinned
                              ? 'text-[#7652C8]'
                              : 'text-[#81749D] dark:text-gray-400'
                          )}
                        >
                          <Pin size={15} fill={entry.is_pinned ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          type="button"
                          onClick={() => open(entry)}
                          title="Edit"
                          aria-label="Edit entry"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#81749D] transition-colors hover:bg-[#F1E8FF] hover:text-[#6240C8] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-purple-300"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleRemove(entry)}
                          title="Delete"
                          aria-label="Delete entry"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#81749D] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex-1">
                      <h3 className="mb-2 break-words text-lg font-bold leading-snug text-[#252044] dark:text-slate-100">
                        {entry.title || 'Untitled'}
                      </h3>

                      <p className="line-clamp-4 min-h-[3.5rem] whitespace-pre-wrap break-words text-sm leading-relaxed text-[#51418F] dark:text-slate-300">
                        {entry.content || 'No additional content'}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EDE2FA] pt-3 dark:border-slate-700">
                      <div className="flex min-w-0 items-center gap-2">
                        <Clock3 size={14} className="shrink-0 text-[#81749D] dark:text-gray-400" />

                        <span className="truncate text-xs font-medium text-[#766A91] dark:text-gray-400">
                          {relativeTime(entry.updated_at)}
                        </span>
                      </div>

                      <span className="shrink-0 rounded-full border border-[#E8D8FF] bg-white/75 px-2.5 py-1 text-[10px] font-semibold text-[#7652C8] dark:border-white/10 dark:bg-slate-800/80 dark:text-purple-300">
                        {Meta.label}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Editor Dialog */}
        <Dialog
          open={editorOpen}
          onClose={close}
          title={editing ? 'Edit entry' : 'New entry'}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>

              <Button onClick={save} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Kind">
                <Select
                  value={form.kind}
                  onChange={(e) =>
                    setForm({ ...form, kind: e.target.value })
                  }
                >
                  {Object.entries(KIND_META).map(([id, meta]) => (
                    <option key={id} value={id}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Category">
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Select
                      value={form.category_id}
                      onChange={(e) =>
                        setForm({ ...form, category_id: e.target.value })
                      }
                    >
                      <option value="">No category</option>

                      {(cats || []).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewCategory}
                    title="Create category"
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              </Field>
            </div>

            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Give your entry a title"
              />
            </Field>

            <Field label="Content">
              <Textarea
                rows={6}
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                placeholder={
                  form.kind === 'checklist'
                    ? 'One item per line'
                    : form.kind === 'link'
                      ? 'https://…'
                      : form.kind === 'snippet'
                        ? 'Paste your code snippet…'
                        : 'Write anything…'
                }
              />
            </Field>

            <div className="pt-1">
              <Switch
                checked={form.is_pinned}
                onChange={(value) =>
                  setForm({ ...form, is_pinned: value })
                }
                label="Pin to top"
              />
            </div>
          </div>
        </Dialog>
      </main>
    </div>
  );
}
