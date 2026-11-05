
// src/pages/personal-space/PersonalSpace.jsx

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
} from 'lucide-react';
import { relativeTime } from '../../lib/utils.js';
import { useConfirm, usePrompt } from '../../contexts/ConfirmContext.jsx';
import lavenderBg from '../../../assets/background/lavender.png';

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
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => personalSpaceApi.updateEntry(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      close();
      toast.success('Updated');
    },
  });

  const remove = useMutation({
    mutationFn: (id) => personalSpaceApi.removeEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
      toast.success('Deleted');
    },
  });

  const pin = useMutation({
    mutationFn: ({ id, val }) =>
      personalSpaceApi.updateEntry(id, { is_pinned: val }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-entries'] });
    },
  });

  const createCat = useMutation({
    mutationFn: (body) => personalSpaceApi.createCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ps-cats'] });
      toast.success('Category created');
    },
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
      style={{ fontFamily: 'Calibri, sans-serif' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${lavenderBg}")` }}
      />

      {/* Transparent Overlay */}
      <div className="absolute inset-0 z-0 bg-white/20 dark:bg-black/20" />

      <main className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-white/85 dark:bg-gray-900/80 border border-[#E8D8FF] dark:border-white/10 shadow-sm">
              <Sparkles size={20} className="text-[#6240C8]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#10123D] dark:text-white">
                Personal Space
              </h1>

              <p className="text-sm text-[#51418F] dark:text-gray-300 mt-0.5">
                Your private collection of notes, links and ideas.
              </p>
            </div>
          </div>

          <Button onClick={() => open()}>
            <Plus size={15} />
            New entry
          </Button>
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] dark:border-white/10 bg-white/85 dark:bg-gray-900/85 p-6 shadow-sm">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry) => {
              const Meta = KIND_META[entry.kind] || KIND_META.note;
              const KindIcon = Meta.icon;

              return (
                <article
                  key={entry.id}
                  className="group relative overflow-hidden rounded-[22px] border border-[#E8D8FF] dark:border-white/10 bg-white/90 dark:bg-gray-900/85 shadow-[0_4px_18px_rgba(98,64,200,0.07)] hover:shadow-[0_8px_26px_rgba(98,64,200,0.13)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="relative z-10 p-5">

                    {/* Card Top */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#6240C8] dark:text-purple-300">
                        <KindIcon size={15} />
                        {Meta.label}
                      </div>

                      <div className="flex items-center gap-1">
                        {entry.is_pinned && (
                          <Pin
                            size={13}
                            className="text-[#6240C8] fill-[#6240C8]"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            pin.mutate({
                              id: entry.id,
                              val: !entry.is_pinned,
                            })
                          }
                          title={entry.is_pinned ? 'Unpin' : 'Pin'}
                          className={`p-1.5 rounded-lg hover:bg-[#F2EBFF] dark:hover:bg-white/10 transition-colors ${
                            entry.is_pinned
                              ? 'text-[#6240C8]'
                              : 'text-[#81749D] dark:text-gray-400'
                          }`}
                        >
                          <Pin size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => open(entry)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-[#81749D] dark:text-gray-400 hover:text-[#6240C8] hover:bg-[#F2EBFF] dark:hover:bg-white/10 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemove(entry)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-[#81749D] dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <h3 className="text-base font-semibold text-[#10123D] dark:text-white mb-2 break-words">
                      {entry.title || 'Untitled'}
                    </h3>

                    <p className="text-sm leading-relaxed text-[#51418F] dark:text-gray-300 line-clamp-4 whitespace-pre-wrap break-words min-h-[3.5rem]">
                      {entry.content}
                    </p>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-[#EDE2FA] dark:border-white/10">
                      <p className="text-xs text-[#8B7DA8] dark:text-gray-400">
                        Updated {relativeTime(entry.updated_at)}
                      </p>
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
          <div className="space-y-4" style={{ fontFamily: 'Calibri, sans-serif' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="flex-1 min-w-0">
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
