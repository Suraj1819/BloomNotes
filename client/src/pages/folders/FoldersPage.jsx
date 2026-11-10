
import { useEffect, useMemo, useState } from 'react';
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
  RefreshCw,
  LayoutGrid,
  List,
  FileText,
  ArrowDownUp,
  Sparkles,
  SearchX,
  Clock3,
} from 'lucide-react';

import { foldersApi } from '../../services/index.js';

import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';

import {
  PageLoader,
  EmptyState,
} from '../../components/ui/Spinner.jsx';

import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import lavenderBackground from '../../../assets/background/fav4.png';
import noteCardBackground from '../../../assets/background/notecard.png';

const glass = 'bn-glass-card';

export default function FoldersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(6);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');

  // Fetch folders
  const {
    data: foldersData,
    isLoading,
    isError,
    error,
    isFetching,
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

  // Search and sort
  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = folders.filter((folder) => {
      if (!query) return true;

      return String(folder.name || '')
        .toLowerCase()
        .includes(query);
    });

    result = [...result].sort((a, b) => {
      if (sort === 'title') {
        return String(a.name || '').localeCompare(
          String(b.name || '')
        );
      }

      const dateA = new Date(
        sort === 'created'
          ? a.created_at || 0
          : a.updated_at || a.created_at || 0
      ).getTime();

      const dateB = new Date(
        sort === 'created'
          ? b.created_at || 0
          : b.updated_at || b.created_at || 0
      ).getTime();

      return dateB - dateA;
    });

    return result;
  }, [folders, search, sort]);

  // Reset pagination
  useEffect(() => {
    setVisibleCount(6);
  }, [search, sort]);

  const visibleFolders = filteredFolders.slice(0, visibleCount);
  const hasSearch = Boolean(search.trim());

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

  // Initial loading
  if (isLoading) return <PageLoader />;

  // Error state
  if (isError) {
    return (
      <div
        className="relative isolate flex min-h-[65vh] items-center justify-center overflow-hidden px-4 py-10"
        style={{
          backgroundImage: `url(${lavenderBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className={`${glass} w-full max-w-md rounded-3xl p-7 text-center sm:p-9`}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <FolderOpen size={25} />
          </div>

          <h2 className="text-xl font-semibold text-text-main">
            Unable to load folders
          </h2>

          <p className="mt-2 text-sm leading-6 text-text-muted">
            {error?.message || 'Your folders could not be loaded.'}
          </p>

          <Button
            className="mt-6"
            onClick={() => refetch()}
            loading={isFetching}
            disabled={isFetching}
          >
            <RefreshCw size={15} />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-transparent"
      style={{
        backgroundImage: `url(${lavenderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white/30 dark:bg-slate-950/80" />

      <main className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">

        {/* Header */}
        <header className="mb-7 sm:mb-9">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-center gap-3.5">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-accent shadow-sm backdrop-blur-xl sm:h-14 sm:w-14">
                <FolderOpen size={25} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                    Folders
                  </h1>

                  <span className="rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted backdrop-blur-xl">
                    {folders.length} folders
                  </span>
                </div>

                <p className="mt-1 text-sm text-text-muted">
                  Your collections, neatly organized in one place.
                </p>
              </div>

            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">

              <Button
                variant="outline"
                onClick={() => refetch()}
                loading={isFetching}
                disabled={isFetching}
                className="shrink-0"
                title="Refresh folders"
              >
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                onClick={() => {
                  setName('');
                  setCreateOpen(true);
                }}
                className="flex-1 justify-center sm:flex-none"
              >
                <Plus size={16} />
                New Folder
              </Button>

            </div>

          </div>

          {/* Decorative divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <FolderOpen size={14} className="text-accent/70" />
            <div className="h-px flex-1 bg-border/60" />
          </div>

        </header>

        {/* Search panel */}
        <section className={`${glass} mb-7 rounded-3xl p-3.5 sm:p-5`}>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* Search */}
            <div className="relative min-w-0 flex-1">

              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search folders by name..."
                aria-label="Search folders"
                className="h-12 w-full rounded-2xl border border-border/70 bg-input/60 pl-11 pr-10 text-sm text-text-main outline-none backdrop-blur-xl transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent/10 hover:text-accent"
                >
                  <X size={15} />
                </button>
              )}

            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2 sm:w-auto">

              <span className="hidden items-center gap-1.5 text-xs font-medium text-text-muted sm:flex">
                <ArrowDownUp size={14} />
                Sort
              </span>

              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-12 w-full sm:w-48"
              >
                <option value="updated">Recently updated</option>
                <option value="created">Recently created</option>
                <option value="title">Name (A-Z)</option>
              </Select>

            </div>

          </div>

          {/* Search information */}
          {hasSearch && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">

              <p className="text-xs text-text-muted">
                Showing {filteredFolders.length} result
                {filteredFolders.length !== 1 ? 's' : ''} for{' '}
                <strong className="text-text-main">
                  "{search}"
                </strong>
              </p>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Clear search
              </button>

            </div>
          )}

        </section>

        {/* Collection toolbar */}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">

          <div>
            <div className="flex items-center gap-2">
              <FolderOpen size={17} className="text-accent" />

              <h2 className="text-lg font-bold tracking-tight text-text-main sm:text-xl">
                Your Collections
              </h2>
            </div>

            <p className="mt-1 text-xs text-text-muted sm:text-sm">
              All your folders and personal collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/55 p-1 backdrop-blur-xl">

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <LayoutGrid size={17} />
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <List size={18} />
              </button>

            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-3 py-2 text-xs font-medium text-text-muted backdrop-blur-xl">
              <FolderIcon size={14} />
              {filteredFolders.length} results
            </div>

          </div>

        </section>

        {/* Folder collection */}
        {filteredFolders.length === 0 ? (

          hasSearch ? (

            <div className={`${glass} rounded-3xl px-5 py-14 text-center sm:py-16`}>

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <SearchX size={27} strokeWidth={1.8} />
              </div>

              <h3 className="text-lg font-semibold text-text-main">
                No matching folders
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
                Try another keyword to find the folder you are looking for.
              </p>

              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setSearch('')}
              >
                <RefreshCw size={15} />
                Clear search
              </Button>

            </div>

          ) : (

            <EmptyState
              icon={FolderOpen}
              title="No folders yet"
              description="Create your first folder to organize your notes. Your collections will appear here."
              action={
                <Button
                  onClick={() => {
                    setName('');
                    setCreateOpen(true);
                  }}
                >
                  <Plus size={15} />
                  Create Folder
                </Button>
              }
            />

          )

        ) : (

          <>

            {/* Folder cards */}
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3'
                  : 'flex flex-col gap-4'
              }
            >

              {visibleFolders.map((folder) => {
                const isEditing = editing?.id === folder.id;

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
                    className={`
                      group relative isolate flex min-w-0 flex-col
                      overflow-hidden rounded-3xl
                      border border-border/60
                      bg-card/60
                      shadow-sm backdrop-blur-xl
                      transition-all duration-200
                      hover:border-accent/35
                      hover:shadow-lg
                      focus-visible:outline-none
                      focus-visible:ring-2 focus-visible:ring-accent/40
                      ${viewMode === 'grid' ? 'min-h-[260px]' : 'min-h-[150px]'}
                      ${isEditing ? 'cursor-default ring-2 ring-accent/30' : 'cursor-pointer'}
                    `}
                  >

                    {/* Original note card background */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl"
                    >
                      <img
                        src={noteCardBackground}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.82] dark:opacity-[0.22]"
                      />

                      <div className="absolute inset-0 bg-white/25 dark:hidden" />

                      <div className="absolute inset-0 hidden bg-[#241820]/75 dark:block" />

                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-rose-100/20 dark:from-rose-950/10 dark:via-transparent dark:to-black/10" />
                    </div>

                    {/* Card accent */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-[22%] z-20 h-[56%] w-[4px] rounded-r-full bg-accent/80"
                    />

                    {/* Card content */}
                    <div className={`relative z-10 flex flex-1 flex-col p-5 sm:p-6 ${
                      viewMode === 'list'
                        ? 'sm:flex-row sm:items-center sm:gap-6'
                        : ''
                    }`}>

                      {/* Card header */}
                      <div className={`flex items-center justify-between gap-3 ${
                        viewMode === 'grid' ? 'mb-6' : 'sm:w-[240px] sm:shrink-0'
                      }`}>

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card/70 text-accent shadow-sm backdrop-blur-xl">
                            <FolderIcon size={21} strokeWidth={1.8} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={11} className="text-accent" />

                              <span className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-accent">
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
                              aria-label={`Rename ${folder.name}`}
                              title="Rename"
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-accent/10 hover:text-accent"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              disabled={remove.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemove(folder);
                              }}
                              aria-label={`Delete ${folder.name}`}
                              title="Delete"
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>
                        )}

                      </div>

                      {/* Rename form */}
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
                            className="border-border bg-card/80"
                          />

                          <div className="mt-3 flex items-center gap-2">

                            <Button
                              size="sm"
                              onClick={handleUpdate}
                              disabled={update.isPending || !name.trim()}
                              loading={update.isPending}
                            >
                              <Check size={14} />
                              Save
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

                        <div className={`min-w-0 flex-1 ${
                          viewMode === 'grid' ? '' : 'sm:py-2'
                        }`}>

                          <button
                            type="button"
                            onClick={() => navigate(`/app/folders/${folder.id}`)}
                            className="mb-2 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <h3 className="line-clamp-2 break-words text-lg font-bold leading-snug tracking-tight text-text-main transition-colors group-hover:text-accent sm:text-xl">
                              {folder.name?.trim() || 'Untitled folder'}
                            </h3>
                          </button>

                          <p className="text-xs leading-6 text-text-muted sm:text-sm">
                            Keep your notes organized in this folder.
                          </p>

                        </div>

                      )}

                      {/* Card footer */}
                      {!isEditing && (
                        <div className={`flex items-center justify-between gap-3 border-t border-border/50 pt-4 ${
                          viewMode === 'grid'
                            ? 'mt-auto'
                            : 'mt-4 sm:mt-0 sm:w-[210px] sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0'
                        }`}>

                          <div className="flex min-w-0 items-center gap-2">
                            <Clock3 size={14} className="shrink-0 text-text-muted" />

                            <span className="truncate text-[11px] font-medium text-text-muted">
                              {formatDate(folder.created_at)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/app/folders/${folder.id}`)}
                            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-semibold text-white shadow-sm transition hover:brightness-95"
                          >
                            Open
                            <ArrowRight size={14} />
                          </button>

                        </div>
                      )}

                    </div>
                  </article>
                );
              })}

            </div>

            {/* Show more */}
            {filteredFolders.length > visibleCount && (
              <div className="mt-7 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((count) => count + 6)}
                >
                  <Plus size={15} />
                  Show more ({Math.min(6, filteredFolders.length - visibleCount)})
                </Button>
              </div>
            )}

            {/* Show less */}
            {visibleCount > 6 && filteredFolders.length > 6 && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(6)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted transition hover:bg-accent/10 hover:text-accent"
                >
                  Show less
                </button>
              </div>
            )}

          </>

        )}

        {/* Footer */}
        {filteredFolders.length > 0 && (
          <footer className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-border/50 pt-5 text-center text-xs text-text-muted">
            <Sparkles size={13} className="text-accent" />
            <span>
              Your collections, organized just the way you like them.
            </span>
          </footer>
        )}

      </main>

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
              loading={create.isPending}
            >
              <Plus size={15} />
              Create folder
            </Button>
          </>
        }
      >
        <div className="space-y-4">

          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FolderIcon size={21} />
            </div>

            <div>
              <p className="text-sm font-semibold text-text-main">
                Create a collection
              </p>

              <p className="mt-0.5 text-xs text-text-muted">
                Organize your notes with a folder.
              </p>
            </div>
          </div>

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

        </div>
      </Dialog>

    </div>
  );
}
