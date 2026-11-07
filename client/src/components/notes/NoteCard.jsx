
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
} from 'lucide-react';

import { toast } from 'sonner';

import { notesApi } from '../../services/index.js';
import { getThemeMeta } from '../../lib/noteThemes.js';

import {
  relativeTime,
  extractTextFromContent,
  cn,
} from '../../lib/utils.js';

import noteFlower from '../../../assets/background/note-card-flower.png';

export function NoteCard({ note }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const menuRef = useRef(null);

  const theme = getThemeMeta(note.theme_id);
  const accent = theme?.swatch || '#9875C9';
  const themeName = theme?.name || 'Personal';

  const title = note.title?.trim() || 'Untitled note';

  // Get complete note text
  const fullContent =
    extractTextFromContent(note.content || '') ||
    note.excerpt ||
    'No additional content yet. Open this note to add your thoughts.';

  // Show More / Show Less
  const needsExpansion = fullContent.length > 180;

  const displayedExcerpt =
    isExpanded || !needsExpansion
      ? fullContent
      : `${fullContent.slice(0, 180).trimEnd()}...`;

  const tags = Array.isArray(note.tags) ? note.tags : [];

  const updatedTime = note.updated_at
    ? relativeTime(note.updated_at)
    : 'Recently created';

  const openNote = () => {
    navigate(`/app/notes/${note.id}`);
  };

  const refreshNotes = () => {
    qc.invalidateQueries({ queryKey: ['notes'] });
  };

  // Favorite mutation
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

  // Pin mutation
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

  // Duplicate mutation
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

  // Delete mutation
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

  const isBusy =
    fav.isPending ||
    pin.isPending ||
    duplicate.isPending ||
    remove.isPending;

  // Close menu on outside click and Escape
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

  const iconButton =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors duration-150 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <article
      className={cn(
        'relative isolate flex min-h-[285px] min-w-0 flex-col overflow-visible',
        'rounded-[22px] border border-border/60',
        'bg-card/70 backdrop-blur-xl',
        'shadow-[0_6px_24px_rgba(35,25,65,0.07)]',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-accent/35',
        'hover:shadow-[0_10px_30px_rgba(35,25,65,0.11)]'
      )}
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

      {/* Soft background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-40 w-40 bg-contain bg-right-bottom bg-no-repeat opacity-[0.18] dark:opacity-[0.10]"
        style={{
          backgroundImage: `url(${noteFlower})`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: accent }}
      />

      {/* Card content */}
      <div className="relative z-10 flex flex-1 flex-col p-5 pl-6 sm:p-6 sm:pl-7">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
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

              <p className="mt-1 text-[11px] text-text-muted">
                Personal collection
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">

            {note.is_pinned && (
              <span
                title="Pinned"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent"
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

            <div
              className="relative"
              ref={menuRef}
            >
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
                <div className="absolute right-0 top-11 z-50 w-48 rounded-2xl border border-border/70 bg-card p-1.5 shadow-xl backdrop-blur-xl">

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openNote();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-text-main hover:bg-accent/10"
                  >
                    <ExternalLink size={15} />
                    Open note
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => duplicate.mutate()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-text-main hover:bg-accent/10 disabled:opacity-50"
                  >
                    <Copy size={15} />
                    Duplicate
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => remove.mutate()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Move to trash
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
          <h3 className="line-clamp-2 break-words text-[21px] font-bold leading-[1.4] tracking-tight text-text-main sm:text-[23px]">
            {title}
          </h3>
        </button>

        {/* Description with Show More */}
        <div className="mb-5">
          <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.85] text-text-muted sm:text-sm">
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
                  className="max-w-[130px] truncate rounded-full px-3 py-1.5 text-[10px] font-semibold"
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
              <span className="rounded-full bg-card/80 px-3 py-1.5 text-[10px] font-medium text-text-muted">
                +{tags.length - 3}
              </span>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">

          <div className="flex min-w-0 items-center gap-2">
            <Clock3
              size={14}
              className="shrink-0 text-text-muted"
            />

            <span className="truncate text-[11px] font-medium text-text-muted">
              {updatedTime}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">

            <button
              type="button"
              disabled={isBusy}
              aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
              title={note.is_pinned ? 'Unpin' : 'Pin'}
              onClick={() => pin.mutate()}
              className={cn(
                iconButton,
                note.is_pinned && 'bg-accent/10 text-accent'
              )}
            >
              <Pin
                size={16}
                fill={note.is_pinned ? 'currentColor' : 'none'}
              />
            </button>

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
              <Star
                size={16}
                fill={note.is_favorite ? 'currentColor' : 'none'}
              />
            </button>

            <button
              type="button"
              onClick={openNote}
              className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
