
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pin,
  Star,
  Trash2,
  MoreVertical,
  Copy,
  Clock3,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { notesApi } from '../../services/index.js';
import { getThemeMeta } from '../../lib/noteThemes.js';
import {
  relativeTime,
  excerptFromContent,
  cn,
} from '../../lib/utils.js';

import noteFlower from '../../../assets/background/note-card-flower.png';

export function NoteCard({ note }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  const theme = getThemeMeta(note.theme_id);

  const refreshNotes = () => {
    qc.invalidateQueries({ queryKey: ['notes'] });
  };

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
    onError: (error) => toast.error(error.message),
  });

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
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => notesApi.remove(note.id),
    onSuccess: () => {
      refreshNotes();
      toast.success('Moved to trash');
      setMenu(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const duplicate = useMutation({
    mutationFn: () => notesApi.duplicate(note.id),
    onSuccess: () => {
      refreshNotes();
      toast.success('Note duplicated');
      setMenu(false);
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  const openNote = () => {
    navigate(`/app/notes/${note.id}`);
  };

  const excerpt =
    excerptFromContent(note.content) ||
    note.excerpt ||
    'No additional content';

  const isBusy =
    fav.isPending ||
    pin.isPending ||
    remove.isPending ||
    duplicate.isPending;

  return (
    <article
      onClick={openNote}
      className={cn(
        'group relative isolate min-h-[215px] cursor-pointer',
        'overflow-hidden rounded-[22px]',
        'border border-[#E8D8FF] bg-white',
        'shadow-[0_4px_12px_rgba(91,55,150,0.09)]',
        'transition-all duration-300',
        'hover:-translate-y-1',
        'hover:border-[#CDA8FF]',
        'hover:shadow-[0_12px_28px_rgba(91,55,150,0.15)]',
        'dark:border-slate-700 dark:bg-slate-900'
      )}
      style={{
        borderLeft: `3px solid ${theme.swatch}`,
        fontFamily: 'Calibri, Arial, sans-serif',
      }}
    >
      {/* Bottom-right floral background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1 -right-1 z-0 h-[82%] w-[48%] bg-contain bg-right-bottom bg-no-repeat opacity-85 transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: `url(${noteFlower})`,
        }}
      />

      {/* Soft white overlay for readable content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-white via-white/95 to-white/10 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/30"
      />

      <div className="relative z-10 flex min-h-[215px] flex-col p-4 sm:p-5">

        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${theme.swatch}20`,
              color: theme.swatch,
            }}
          >
            <span className="text-xl font-semibold">
              {note.title?.trim()?.charAt(0)?.toUpperCase() || 'N'}
            </span>
          </div>

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMenu((current) => !current);
              }}
              aria-label="More note options"
              aria-expanded={menu}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#51418F] transition hover:bg-[#F1E8FF] dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <MoreVertical size={19} />
            </button>

            {menu && (
              <div
                onClick={(event) => event.stopPropagation()}
                className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-[#E8D8FF] bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    openNote();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#F5EEFF] dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ExternalLink size={15} />
                  Open note
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => duplicate.mutate()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#F5EEFF] disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Copy size={15} />
                  Duplicate
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => remove.mutate()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={15} />
                  Move to trash
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 text-lg font-bold leading-snug text-[#10123D] dark:text-slate-100 sm:text-xl">
          {note.title || 'Untitled'}
        </h3>

        {/* Description */}
        <p className="mb-3 line-clamp-2 max-w-[88%] text-sm leading-relaxed text-[#51418F] dark:text-slate-300">
          {excerpt}
        </p>

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {note.tags.slice(0, 3).map((tag, index) => (
              <span
                key={tag.id || tag.name || index}
                className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  color: theme.swatch,
                  backgroundColor: `${theme.swatch}12`,
                  borderColor: `${theme.swatch}30`,
                }}
              >
                {tag.name || tag}
              </span>
            ))}

            {note.tags.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EDE2FA] pt-3 dark:border-slate-700">

          <div className="flex min-w-0 items-center gap-2">
            <Clock3
              size={14}
              className="shrink-0 text-[#62529D]"
            />

            <span className="truncate text-xs font-medium text-[#51418F] dark:text-slate-400">
              {relativeTime(note.updated_at)}
            </span>

            <span className="hidden h-1 w-1 shrink-0 rounded-full bg-slate-300 sm:block" />

            <span
              className="hidden truncate rounded-full px-3 py-1 text-[11px] font-semibold sm:inline-flex"
              style={{
                color: theme.swatch,
                backgroundColor: `${theme.swatch}18`,
              }}
            >
              {theme.name}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {/* Pin */}
            <button
              type="button"
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                pin.mutate();
              }}
              aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                'transition-all duration-200',
                'hover:bg-[#FCE7F3] disabled:opacity-50',
                note.is_pinned
                  ? 'bg-[#FCE7F3] text-[#B83280]'
                  : 'bg-white/80 text-[#51418F] hover:text-[#B83280]'
              )}
            >
              <Pin
                size={17}
                fill={note.is_pinned ? 'currentColor' : 'none'}
              />
            </button>

            {/* Favorite */}
            <button
              type="button"
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                fav.mutate();
              }}
              aria-label={
                note.is_favorite
                  ? 'Remove from favorites'
                  : 'Add to favorites'
              }
              title={
                note.is_favorite
                  ? 'Remove from favorites'
                  : 'Add to favorites'
              }
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                'transition-all duration-200',
                'hover:bg-[#F1E8FF] disabled:opacity-50',
                note.is_favorite
                  ? 'bg-[#F1E8FF] text-[#6240C8]'
                  : 'bg-white/80 text-[#51418F] hover:text-[#6240C8]'
              )}
            >
              <Star
                size={17}
                fill={note.is_favorite ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
