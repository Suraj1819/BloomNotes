
import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[5px] dark:bg-black/55"
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative my-auto flex w-full min-w-0 flex-col',
          'max-h-[min(88vh,850px)] overflow-hidden',
          'rounded-[24px] border border-white/65',
          'bg-white/[0.92] backdrop-blur-2xl',
          'shadow-[0_24px_80px_rgba(30,20,50,0.22)]',
          'dark:border-white/[0.10]',
          'dark:bg-[#282430]/[0.96]',
          'dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
          'animate-in fade-in zoom-in-[0.98] duration-200',
          sizes[size] || sizes.md
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && (
              <h3
                id={titleId}
                className="truncate text-base font-bold tracking-tight text-text-main sm:text-lg"
              >
                {title}
              </h3>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center',
              'rounded-xl border border-border/60',
              'bg-white/60 text-text-muted transition-all',
              'hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500',
              'dark:bg-white/[0.04]'
            )}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-white/30 px-5 py-4 dark:bg-white/[0.02] sm:px-6">
            {footer}
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}
