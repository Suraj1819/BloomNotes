import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest callback without restarting the focus effect on each render.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusFirstElement = () => {
      const first = panelRef.current?.querySelector(focusableSelector);
      first?.focus();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = [
        ...(panelRef.current?.querySelectorAll(focusableSelector) || []),
      ].filter((element) => element.offsetParent !== null);

      if (!elements.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const focusFrame = requestAnimationFrame(focusFirstElement);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener('keydown', handleKeyDown);

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [open, closeOnEscape]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto overscroll-contain p-3 sm:p-5"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      <div
        className="fixed inset-0 z-0 bg-[#17111B]/40 backdrop-blur-[7px] dark:bg-black/65 animate-in fade-in duration-200"
        aria-hidden="true"
      />

      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 my-auto flex w-full min-w-0 flex-col',
          sizes[size] || sizes.md,
          'max-h-[min(92dvh,950px)] min-h-0 overflow-hidden',
          'rounded-[22px] border border-white/75 bg-white/[0.96] backdrop-blur-2xl sm:rounded-[26px]',
          'shadow-[0_30px_100px_rgba(42,25,45,0.20)] ring-1 ring-black/[0.03]',
          'dark:border-white/[0.10] dark:bg-[#26212B]/[0.97]',
          'dark:shadow-[0_30px_100px_rgba(0,0,0,0.55)]',
          'animate-in fade-in zoom-in-[0.97] duration-200 ease-out'
        )}
      >
        <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-[#EAE2E7] bg-white/60 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.025] sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 id={titleId} className="truncate text-base font-bold tracking-tight text-[#30232B] dark:text-white sm:text-lg">
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="mt-1 max-w-2xl text-xs leading-5 text-[#897780] dark:text-[#B8A7AF]">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={() => onCloseRef.current?.()}
              aria-label="Close dialog"
              className={cn(
                'group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                'border border-[#EAE2E7] bg-white/80 text-[#897780]',
                'transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A65F75]/40',
                'dark:border-white/10 dark:bg-white/[0.04] dark:text-[#B8A7AF]',
                'dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400'
              )}
            >
              <X size={17} strokeWidth={2} className="transition-transform duration-200 group-hover:rotate-90" />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(166,95,117,0.35)_transparent] sm:px-6 sm:py-6">
          {children}
        </div>

        {footer && (
          <footer className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#EAE2E7] bg-white/75 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.025] sm:gap-3 sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body
  );
}
