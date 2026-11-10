
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  FileText,
  Pin,
  Star,
  Trash2,
  Copy,
  Clock3,
  MoreHorizontal,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Archive,
  ArchiveRestore,
  Loader2,
} from 'lucide-react';

import { toast } from 'sonner';

import { notesApi } from '../../services/index.js';
import { getThemeMeta } from '../../lib/noteThemes.js';

import {
  relativeTime,
  extractTextFromContent,
  cn,
} from '../../lib/utils.js';

import noteCardBackground from '../../../assets/background/notecard.png';

export function NoteCard({ note, isArchived = false }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const menuRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Note information
  // ---------------------------------------------------------------------------

  const theme = getThemeMeta(note.theme_id);
  const accent = theme?.swatch || '#C66F8D';
  const themeName = theme?.name || 'Personal';

  const title = note.title?.trim() || 'Untitled note';

  const fullContent =
    extractTextFromContent(note.content || '') ||
    note.excerpt ||
    'No additional content yet. Open this note to add your thoughts.';

  const needsExpansion = fullContent.length > 180;

  const displayedExcerpt =
    isExpanded || !needsExpansion
      ? fullContent
      : `${fullContent.slice(0, 180).trimEnd()}...`;

  const tags = Array.isArray(note.tags) ? note.tags : [];

  const updatedTime = note.updated_at
    ? relativeTime(note.updated_at)
    : 'Recently created';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const openNote = () => {
    navigate(`/app/notes/${note.id}`);
  };

  const refreshNotes = () => {
    qc.invalidateQueries({ queryKey: ['notes'] });
  };

  // ---------------------------------------------------------------------------
  // Favorite mutation
  // ---------------------------------------------------------------------------

  const fav = useMutation({
    mutationFn: () => notesApi.toggleFavorite(note.id),

    onSuccess: () => {
      refreshNotes();

      toast.success(
        note.is_favorite
          ? 'Removed from favorites'
          : 'Added to favorites'
      );
    },

    onError: (error) => {
      toast.error(error.message || 'Could not update favorite');
    },
  });

  // ---------------------------------------------------------------------------
  // Pin mutation
  // ---------------------------------------------------------------------------

  const pin = useMutation({
    mutationFn: () =>
      note.is_pinned
        ? notesApi.unpin(note.id)
        : notesApi.pin(note.id),

    onSuccess: () => {
      refreshNotes();

      toast.success(
        note.is_pinned ? 'Note unpinned' : 'Note pinned'
      );
    },

    onError: (error) => {
      toast.error(error.message || 'Could not update pin');
    },
  });

  // ---------------------------------------------------------------------------
  // Archive / Restore mutation
  // ---------------------------------------------------------------------------

  const archive = useMutation({
    mutationFn: () =>
      isArchived
        ? notesApi.unarchive(note.id)
        : notesApi.archive(note.id),

    onSuccess: () => {
      refreshNotes();
      setMenuOpen(false);

      toast.success(
        isArchived
          ? 'Note restored to your collection'
          : 'Note moved to archive'
      );
    },

    onError: (error) => {
      toast.error(error.message || 'Could not update archive');
    },
  });

  // ---------------------------------------------------------------------------
  // Duplicate mutation
  // ---------------------------------------------------------------------------

  const duplicate = useMutation({
    mutationFn: () => notesApi.duplicate(note.id),

    onSuccess: () => {
      refreshNotes();
      setMenuOpen(false);

      toast.success('Note duplicated');
    },

    onError: (error) => {
      toast.error(error.message || 'Could not duplicate note');
    },
  });

  // ---------------------------------------------------------------------------
  // Trash mutation
  // ---------------------------------------------------------------------------

  const remove = useMutation({
    mutationFn: () => notesApi.remove(note.id),

    onSuccess: () => {
      refreshNotes();
      setMenuOpen(false);

      toast.success('Moved to trash');
    },

    onError: (error) => {
      toast.error(error.message || 'Could not delete note');
    },
  });

  // ---------------------------------------------------------------------------
  // IMPORTANT: Busy state AFTER all mutation declarations
  // ---------------------------------------------------------------------------

  const isBusy =
    fav.isPending ||
    pin.isPending ||
    archive.isPending ||
    duplicate.isPending ||
    remove.isPending;

  // ---------------------------------------------------------------------------
  // Dropdown outside click and Escape
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Reusable styles
  // ---------------------------------------------------------------------------

  const iconButton =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors duration-150 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50';

  const menuItem = `
    flex w-full items-center gap-2.5
    rounded-xl px-3 py-2.5
    text-left text-sm font-medium
    !text-[#49333D]
    transition-colors
    hover:bg-rose-50
    focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-accent/30
    dark:!text-[#F8EAF1]
    dark:hover:bg-white/10
    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

  const ActionSpinner = () => (
    <Loader2
      size={16}
      className="shrink-0 animate-spin"
      aria-hidden="true"
    />
  );

  // ---------------------------------------------------------------------------
  // Card
  // ---------------------------------------------------------------------------

  return (
    <article
      className={cn(
        'relative isolate flex min-h-[285px] min-w-0 flex-col overflow-visible',
        'rounded-[22px] border border-rose-200/70 dark:border-rose-300/15',
        'bg-[#FFF8FA]/75 dark:bg-[#241820]/95',
        'shadow-[0_8px_28px_rgba(137,67,91,0.10)]',
        'transition-[border-color,box-shadow,transform] duration-200',
        'hover:-translate-y-0.5 hover:border-rose-300/80',
        'hover:shadow-[0_14px_34px_rgba(137,67,91,0.15)]',
        'dark:hover:border-rose-300/25 dark:hover:shadow-[0_14px_34px_rgba(0,0,0,0.28)]'
      )}
    >

      {/* Floral background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[22px]"
      >
        <img
          src={noteCardBackground}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.88] dark:opacity-[0.24]"
        />

        <div className="absolute inset-0 bg-white/25 dark:hidden" />

        <div className="absolute inset-0 hidden bg-[#241820]/75 dark:block" />

        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-rose-100/20 dark:from-rose-950/10 dark:via-transparent dark:to-black/10" />
      </div>

      {/* Theme accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[22%] z-20 h-[56%] w-[4px] rounded-r-full"
        style={{
          backgroundColor: accent,
          boxShadow: `0 0 12px ${accent}55`,
        }}
      />

      {/* Theme glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-[1] h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: accent }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col p-5 pl-6 sm:p-6 sm:pl-7">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60 shadow-sm dark:border-white/10"
              style={{
                color: accent,
                backgroundColor: `${accent}18`,
              }}
            >
              <FileText size={20} strokeWidth={1.8} />
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
                  {themeName}
                </span>
              </div>

              <p className="mt-1 text-[11px] text-[#806D76] dark:text-[#C5B2BA]">
                {isArchived
                  ? 'Archived collection'
                  : 'Personal collection'}
              </p>

            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-1">

            {isArchived && (
              <span
                title="Archived"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
              >
                <Archive size={15} />
              </span>
            )}

            {!isArchived && note.is_pinned && (
              <span
                title="Pinned"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100/80 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300"
              >
                <Pin size={15} fill="currentColor" />
              </span>
            )}

            {note.is_favorite && (
              <span
                title="Favorite"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <Star size={15} fill="currentColor" />
              </span>
            )}

            {/* Options dropdown */}
            <div className="relative" ref={menuRef}>

              <button
                type="button"
                aria-label="More note options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((value) => !value)}
                className={iconButton}
              >
                <MoreHorizontal size={20} />
              </button>

              {menuOpen && (
                <div
                  className="
                    absolute right-0 top-11 z-50
                    w-56 overflow-hidden rounded-2xl
                    border border-rose-200/80
                    bg-white p-1.5
                    shadow-xl shadow-black/10
                    dark:border-white/10
                    dark:bg-[#251923]
                    dark:shadow-black/40
                  "
                >

                  {/* Open note */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setMenuOpen(false);
                      openNote();
                    }}
                    className={menuItem}
                  >
                    <ExternalLink size={16} className="shrink-0" />
                    <span>Open note</span>
                  </button>

                  {/* Archive / Restore */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => archive.mutate()}
                    className={menuItem}
                    aria-busy={archive.isPending}
                  >
                    {archive.isPending ? (
                      <ActionSpinner />
                    ) : isArchived ? (
                      <ArchiveRestore size={16} className="shrink-0" />
                    ) : (
                      <Archive size={16} className="shrink-0" />
                    )}

                    <span>
                      {archive.isPending
                        ? isArchived
                          ? 'Restoring...'
                          : 'Archiving...'
                        : isArchived
                          ? 'Restore to notes'
                          : 'Move to archive'}
                    </span>
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => duplicate.mutate()}
                    className={menuItem}
                    aria-busy={duplicate.isPending}
                  >
                    {duplicate.isPending ? (
                      <ActionSpinner />
                    ) : (
                      <Copy size={16} className="shrink-0" />
                    )}

                    <span>
                      {duplicate.isPending
                        ? 'Duplicating...'
                        : 'Duplicate'}
                    </span>
                  </button>

                  <div className="my-1.5 border-t border-rose-100 dark:border-white/10" />

                  {/* Move to trash */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => remove.mutate()}
                    className="
                      flex w-full items-center gap-2.5
                      rounded-xl px-3 py-2.5
                      text-left text-sm font-medium
                      !text-red-600
                      transition-colors
                      hover:bg-red-50
                      focus-visible:outline-none
                      focus-visible:ring-2 focus-visible:ring-red-400/30
                      dark:!text-red-400
                      dark:hover:bg-red-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                    aria-busy={remove.isPending}
                  >
                    {remove.isPending ? (
                      <ActionSpinner />
                    ) : (
                      <Trash2 size={16} className="shrink-0" />
                    )}

                    <span>
                      {remove.isPending
                        ? 'Moving to trash...'
                        : 'Move to trash'}
                    </span>
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <button
          type="button"
          onClick={openNote}
          className="mb-3 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <h3 className="line-clamp-2 break-words text-[21px] font-bold leading-[1.4] tracking-tight text-[#382832] sm:text-[23px] dark:text-[#FFF1F5]">
            {title}
          </h3>
        </button>

        {/* Description */}
        <div className="mb-5">

          <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.85] text-[#705D67] sm:text-sm dark:text-[#D5C5CC]">
            {displayedExcerpt}
          </p>

          {needsExpansion && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="mt-2 text-xs font-semibold transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              style={{ color: accent }}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}

        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">

            {tags.slice(0, 3).map((tag, index) => {
              const name =
                typeof tag === 'string' ? tag : tag?.name;

              if (!name) return null;

              return (
                <span
                  key={tag.id || tag.name || index}
                  className="max-w-[130px] truncate rounded-full border border-white/50 px-3 py-1.5 text-[10px] font-semibold dark:border-white/10"
                  style={{
                    color: accent,
                    backgroundColor: `${accent}15`,
                  }}
                >
                  {name}
                </span>
              );
            })}

            {tags.length > 3 && (
              <span className="rounded-full bg-white/50 px-3 py-1.5 text-[10px] font-medium text-text-muted dark:bg-white/5">
                +{tags.length - 3}
              </span>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-rose-200/50 pt-3 dark:border-white/10">

          <div className="flex min-w-0 items-center gap-2">

            <Clock3
              size={14}
              className="shrink-0 text-[#927D87] dark:text-[#BCAAB2]"
            />

            <span className="truncate text-[11px] font-medium text-[#806D76] dark:text-[#C5B2BA]">
              {updatedTime}
            </span>

          </div>

          <div className="flex shrink-0 items-center gap-1">

            {!isArchived && (
              <>
                {/* Pin */}
                <button
                  type="button"
                  disabled={isBusy}
                  aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
                  title={note.is_pinned ? 'Unpin' : 'Pin'}
                  onClick={() => pin.mutate()}
                  className={cn(
                    iconButton,
                    note.is_pinned &&
                      'bg-rose-100/80 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300'
                  )}
                >
                  {pin.isPending ? (
                    <ActionSpinner />
                  ) : (
                    <Pin
                      size={16}
                      fill={note.is_pinned ? 'currentColor' : 'none'}
                    />
                  )}
                </button>

                {/* Favorite */}
                <button
                  type="button"
                  disabled={isBusy}
                  aria-label={
                    note.is_favorite
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                  title={note.is_favorite ? 'Unfavorite' : 'Favorite'}
                  onClick={() => fav.mutate()}
                  className={cn(
                    iconButton,
                    note.is_favorite &&
                      'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  )}
                >
                  {fav.isPending ? (
                    <ActionSpinner />
                  ) : (
                    <Star
                      size={16}
                      fill={note.is_favorite ? 'currentColor' : 'none'}
                    />
                  )}
                </button>
              </>
            )}

            {/* Open */}
            <button
              type="button"
              onClick={openNote}
              disabled={isBusy}
              className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              Open
              <ArrowUpRight size={14} />
            </button>

          </div>
        </div>

      </div>
    </article>
  );
}

export default NoteCard;
