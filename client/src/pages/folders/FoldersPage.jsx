
// src/pages/notes/FoldersPage.jsx

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
  Sparkles,
  Clock3,
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

  // Fetch folders
  const {
    data: foldersData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.list(),
  });

  const folders = Array.isArray(foldersData)
    ? foldersData
    : foldersData?.items || [];

  // Create folder
  const create = useMutation({
    mutationFn: (body) => foldersApi.create(body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setCreateOpen(false);
      setName('');
      toast.success('Folder created');
    },

    onError: (error) => {
      toast.error(error.message || 'Could not create folder');
    },
  });

  // Rename folder
  const update = useMutation({
    mutationFn: ({ id, body }) => foldersApi.update(id, body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setEditing(null);
      setName('');
      toast.success('Folder renamed');
    },

    onError: (error) => {
      toast.error(error.message || 'Could not rename folder');
    },
  });

  // Delete folder
  const remove = useMutation({
    mutationFn: (id) => foldersApi.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder deleted');
    },

    onError: (error) => {
      toast.error(error.message || 'Could not delete folder');
    },
  });

  // Search folders
  const filteredFolders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return folders.filter((folder) =>
      folder.name?.toLowerCase().includes(term)
    );
  }, [folders, search]);

  // Create handler
  const handleCreate = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      toast.error('Please enter a folder name');
      return;
    }

    create.mutate({ name: trimmed });
  };

  // Start editing
  const startEditing = (folder) => {
    setEditing(folder);
    setName(folder.name || '');
  };

  // Cancel editing
  const cancelEditing = () => {
    if (update.isPending) return;

    setEditing(null);
    setName('');
  };

  // Update handler
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

  // Delete confirmation
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

  // Format date
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
      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-white/20 dark:bg-black/20" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <FolderOpen size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
                Folders
              </h1>

              <p className="mt-1 text-sm text-text-muted">
                Organize your notes and keep everything in one place.
              </p>
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-black/25">
              <FolderIcon size={15} className="text-rose-500" />

              <span className="text-sm font-medium text-text-main">
                {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
              </span>
            </div>

            <Button
              onClick={() => {
                setName('');
                setCreateOpen(true);
              }}
              className="bg-[#B8326B] text-white hover:bg-[#9F285B]"
            >
              <Plus size={16} />
              New folder
            </Button>

          </div>
        </div>

        {/* Search */}
        <div className="mb-6">

          <div className="relative w-full sm:max-w-sm">

            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search folders..."
              className="border-white/70 bg-white/70 pl-10 pr-10 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/25"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-main"
              >
                <X size={15} />
              </button>
            )}

          </div>
        </div>

        {/* Empty folders */}
        {folders.length === 0 ? (

          <div className="rounded-[22px] border border-white/70 bg-white/70 px-5 py-12 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/25">

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
                  className="bg-[#B8326B] text-white hover:bg-[#9F285B]"
                >
                  <Plus size={15} />
                  Create folder
                </Button>
              }
            />

          </div>

        ) : filteredFolders.length === 0 ? (

          <div className="rounded-[22px] border border-white/70 bg-white/70 px-5 py-12 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/25">

            <Search
              size={28}
              className="mx-auto mb-3 text-rose-500"
            />

            <p className="font-semibold text-text-main">
              No matching folders
            </p>

            <p className="mt-1 text-sm text-text-muted">
              Try searching with another name.
            </p>

          </div>

        ) : (

          <>
            {/* Section heading */}
            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold text-text-main">
                  Your folders
                </h2>

                <p className="mt-1 text-sm text-text-muted">
                  All your collections in one place.
                </p>
              </div>

              <span className="text-xs font-medium text-text-muted">
                {filteredFolders.length} shown
              </span>

            </div>

            {/* Folder cards - NoteCard visual style */}
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {filteredFolders.map((folder) => {
                const isEditing = editing?.id === folder.id;
                const accent = '#9875C9';

                return (
                  <article
                    key={folder.id}
                    onClick={() => {
                      if (!isEditing) {
                        navigate(`/app/folders/${folder.id}`);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        !isEditing &&
                        (event.key === 'Enter' || event.key === ' ')
                      ) {
                        event.preventDefault();
                        navigate(`/app/folders/${folder.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={isEditing ? -1 : 0}
                    aria-label={`Open folder ${folder.name}`}
                    className={`group relative isolate flex min-h-[285px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/70 shadow-[0_6px_24px_rgba(35,25,65,0.07)] backdrop-blur-xl transition-[border-color,box-shadow] duration-200 hover:border-accent/35 hover:shadow-[0_10px_30px_rgba(35,25,65,0.11)] ${
                      isEditing
                        ? 'cursor-default ring-2 ring-accent/30'
                        : 'cursor-pointer'
                    }`}
                  >

                    {/* Left accent stripe */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-[22%] z-20 h-[56%] w-[4px] rounded-r-full"
                      style={{
                        backgroundColor: accent,
                        boxShadow: `0 0 12px ${accent}55`,
                      }}
                    />

                    {/* Floral decoration */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 right-0 z-0 h-40 w-40 bg-contain bg-right-bottom bg-no-repeat opacity-[0.18] dark:opacity-[0.10] transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url(${noteFlower})`,
                      }}
                    />

                    {/* Accent glow */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute right-0 top-0 z-0 h-36 w-36 rounded-full opacity-20 blur-3xl"
                      style={{ backgroundColor: accent }}
                    />

                    {/* Card content */}
                    <div className="relative z-10 flex flex-1 flex-col p-5 pl-6 sm:p-6 sm:pl-7">

                      {/* Card header */}
                      <div className="mb-6 flex items-center justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                              color: accent,
                              backgroundColor: `${accent}18`,
                            }}
                          >
                            <FolderIcon size={20} strokeWidth={1.8} />
                          </div>

                          <div className="min-w-0">

                            <div className="flex items-center gap-1.5">
                              <Sparkles
                                size={11}
                                style={{ color: accent }}
                              />

                              <span
                                className="truncate text-[11px] font-bold uppercase tracking-[0.13em]"
                                style={{ color: accent }}
                              >
                                Folder collection
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] text-text-muted">
                              Personal collection
                            </p>

                          </div>
                        </div>

                        {!isEditing && (
                          <div className="flex shrink-0 items-center gap-1">

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditing(folder);
                              }}
                              aria-label="Rename folder"
                              title="Rename"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors duration-150 hover:bg-accent/10 hover:text-accent"
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
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>
                        )}

                      </div>

                      {/* Rename area */}
                      {isEditing ? (

                        <div
                          className="flex flex-1 flex-col"
                          onClick={(event) => event.stopPropagation()}
                        >

                          <label className="mb-2 text-xs font-semibold text-text-main">
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
                            className="border-border bg-card"
                          />

                          <div className="mt-3 flex items-center gap-2">

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

                      ) : (

                        <>
                          {/* Folder title */}
                          <button
                            type="button"
                            onClick={() => navigate(`/app/folders/${folder.id}`)}
                            className="mb-3 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <h3 className="line-clamp-2 break-words text-[21px] font-bold leading-[1.4] tracking-tight text-text-main sm:text-[23px]">
                              {folder.name?.trim() || 'Untitled folder'}
                            </h3>
                          </button>

                          {/* Description */}
                          <p className="mb-5 text-[13px] leading-[1.85] text-text-muted sm:text-sm">
                            Keep your notes organized in this folder.
                          </p>
                        </>

                      )}

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">

                        <div className="flex min-w-0 items-center gap-2">
                          <Clock3
                            size={14}
                            className="shrink-0 text-text-muted"
                          />

                          <span className="truncate text-[11px] font-medium text-text-muted">
                            {formatDate(folder.created_at)}
                          </span>
                        </div>

                        {!isEditing ? (

                          <button
                            type="button"
                            onClick={() => navigate(`/app/folders/${folder.id}`)}
                            className="ml-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            style={{ backgroundColor: accent }}
                          >
                            Open
                            <ArrowRight size={14} />
                          </button>

                        ) : (

                          <span className="text-xs font-medium text-text-muted">
                            Editing
                          </span>

                        )}

                      </div>

                    </div>
                  </article>
                );
              })}

            </div>
          </>
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
              className="bg-[#B8326B] text-white hover:bg-[#9F285B]"
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
