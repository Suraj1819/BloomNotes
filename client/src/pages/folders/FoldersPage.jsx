
import { useMemo, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  Folder as FolderIcon,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  Search,
  X,
  Check,
} from 'lucide-react';

import { foldersApi } from '../../services/index.js';

import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import lavenderBg from '../../../assets/background/lavender.png';
import noteFlower from '../../../assets/background/note-card-flower.png';

export default function FoldersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');

  const {
    data: folders = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  const create = useMutation({
    mutationFn: (body) => foldersApi.create(body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setCreateOpen(false);
      setName('');
      toast.success('Folder created');
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => foldersApi.update(id, body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setEditing(null);
      setName('');
      toast.success('Folder renamed');
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => foldersApi.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder deleted');
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredFolders = useMemo(() => {
    return folders.filter((folder) =>
      folder.name?.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [folders, search]);

  const handleCreate = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      toast.error('Please enter a folder name');
      return;
    }

    create.mutate({ name: trimmed });
  };

  const startEditing = (folder) => {
    setEditing(folder);
    setName(folder.name || '');
  };

  const cancelEditing = () => {
    if (update.isPending) return;

    setEditing(null);
    setName('');
  };

  const handleUpdate = () => {
    const trimmed = name.trim();

    if (!trimmed || !editing) {
      toast.error('Please enter a folder name');
      return;
    }

    if (trimmed === editing.name) {
      cancelEditing();
      return;
    }

    update.mutate({
      id: editing.id,
      body: { name: trimmed },
    });
  };

  const handleRemove = async (folder) => {
    const confirmed = await confirm({
      title: 'Delete folder?',
      description: `"${folder.name}" will be deleted. Notes inside it will be kept as unfiled notes.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (confirmed) {
      remove.mutate(folder.id);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Folder';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Folder';
    }

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <FolderOpen
          size={32}
          className="mx-auto mb-3 text-text-muted"
        />

        <p className="mb-4 text-text-main">
          Unable to load folders.
        </p>

        <Button onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

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
      <div className="pointer-events-none absolute inset-0 bg-white/10 dark:bg-black/10" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] dark:bg-purple-950/50 dark:text-purple-400">
              <FolderOpen size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#10123D] dark:text-slate-100 sm:text-3xl">
                Folders
              </h1>

              <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
                Organize your notes and keep everything in one place.
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setName('');
              setCreateOpen(true);
            }}
            className="self-start sm:self-auto"
          >
            <Plus size={16} />
            New folder
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#62529D]"
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search folders..."
              className="bg-white/75 pl-10 pr-10 dark:bg-slate-900/70"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <span className="text-sm font-medium text-[#51418F] dark:text-slate-400">
            {filteredFolders.length} folders
          </span>
        </div>

        {/* Folder list */}
        {folders.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <EmptyState
              icon={FolderIcon}
              title="No folders yet"
              description="Create your first folder to organize your notes."
              action={
                <Button
                  onClick={() => {
                    setName('');
                    setCreateOpen(true);
                  }}
                >
                  <Plus size={15} />
                  Create folder
                </Button>
              }
            />
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/75 px-5 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <Search
              size={28}
              className="mx-auto mb-3 text-[#62529D]"
            />

            <p className="font-semibold text-[#10123D] dark:text-slate-100">
              No matching folders
            </p>

            <p className="mt-1 text-sm text-[#51418F] dark:text-slate-400">
              Try searching with another name.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFolders.map((folder) => {
              const isEditing = editing?.id === folder.id;

              return (
                <article
                  key={folder.id}
                  onClick={() => {
                    if (!isEditing) {
                      navigate(`/app/folders/${folder.id}`);
                    }
                  }}
                  className={`group relative isolate min-h-[190px] overflow-hidden rounded-[22px] border border-[#E8D8FF] bg-white shadow-[0_4px_12px_rgba(91,55,150,0.09)] transition-all duration-300 hover:border-[#CDA8FF] hover:shadow-[0_12px_28px_rgba(91,55,150,0.15)] dark:border-slate-700 dark:bg-slate-900 ${
                    isEditing
                      ? 'cursor-default ring-2 ring-[#CDA8FF]/40'
                      : 'cursor-pointer hover:-translate-y-1'
                  }`}
                >
                  {/* Floral background */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1 -right-1 z-0 h-[82%] w-[48%] bg-contain bg-right-bottom bg-no-repeat opacity-85 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${noteFlower})`,
                    }}
                  />

                  {/* Readability overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-white via-white/95 to-white/10 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/30"
                  />

                  <div className="relative z-10 flex min-h-[190px] flex-col p-4 sm:p-5">

                    {/* Card header */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#6240C8] dark:bg-purple-950/50 dark:text-purple-400">
                        <FolderIcon size={22} />
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditing(folder);
                            }}
                            aria-label="Rename folder"
                            title="Rename"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#51418F] transition hover:bg-[#F1E8FF] dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            disabled={remove.isPending}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemove(folder);
                            }}
                            aria-label="Delete folder"
                            title="Delete"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#51418F] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-red-950/30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline rename area */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                        isEditing
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        {isEditing && (
                          <div
                            className="mb-3 space-y-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <label className="block text-xs font-semibold text-[#6240C8] dark:text-purple-300">
                              Rename folder
                            </label>

                            <Input
                              value={name}
                              onChange={(event) => setName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' && !update.isPending) {
                                  handleUpdate();
                                }

                                if (event.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                              placeholder="Enter folder name"
                              autoFocus
                              maxLength={80}
                              disabled={update.isPending}
                              className="border-[#DCC8FA] bg-white/90 dark:border-slate-600 dark:bg-slate-800"
                            />

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={handleUpdate}
                                disabled={update.isPending || !name.trim()}
                              >
                                <Check size={14} />
                                {update.isPending ? 'Saving...' : 'Save'}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                                disabled={update.isPending}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Folder name */}
                    {!isEditing && (
                      <>
                        <h3 className="mb-1 line-clamp-2 text-lg font-bold leading-snug text-[#10123D] dark:text-slate-100 sm:text-xl">
                          {folder.name || 'Untitled folder'}
                        </h3>

                        <p className="mb-3 line-clamp-2 max-w-[88%] text-sm leading-relaxed text-[#51418F] dark:text-slate-300">
                          Keep your notes organized in this folder.
                        </p>
                      </>
                    )}

                    {/* Card footer */}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EDE2FA] pt-3 dark:border-slate-700">
                      <span className="truncate text-xs font-medium text-[#51418F] dark:text-slate-400">
                        {formatDate(folder.created_at)}
                      </span>

                      {!isEditing && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#6240C8] dark:text-purple-400">
                          Open folder
                          <ArrowRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      )}

                      {isEditing && (
                        <span className="text-xs font-medium text-[#6240C8] dark:text-purple-400">
                          Editing
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Create folder dialog */}
      <Dialog
        open={createOpen}
        onClose={() => {
          if (!create.isPending) {
            setCreateOpen(false);
          }
        }}
        title="New folder"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={handleCreate}
              disabled={create.isPending || !name.trim()}
            >
              <Plus size={15} />
              {create.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <Field label="Folder name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !create.isPending) {
                handleCreate();
              }
            }}
            placeholder="Enter folder name"
            autoFocus
            maxLength={80}
          />
        </Field>
      </Dialog>
    </div>
  );
}
