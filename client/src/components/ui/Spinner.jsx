
import { cn } from '../../lib/utils.js';

/**
 * Professional reusable loading spinner
 */
export const Spinner = ({
  className,
  size = 16,
}) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      'relative inline-flex shrink-0 items-center justify-center',
      className
    )}
    style={{ width: size, height: size }}
  >
    <span className="absolute inset-0 rounded-full border-[2px] border-current opacity-15" />

    <span
      className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-current border-r-current animate-spin motion-reduce:animate-none"
      style={{ animationDuration: '850ms' }}
    />
  </span>
);

/**
 * Full page loading screen
 */
export const PageLoader = ({
  label = 'Loading…',
  className,
}) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      'flex min-h-[60vh] w-full flex-col items-center justify-center',
      'gap-5 px-5 py-12 text-center',
      className
    )}
  >
    {/* Dual Ring Loader */}
    <div className="relative flex h-14 w-14 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-accent/[0.07] blur-xl" />

      <div className="absolute inset-0 rounded-full border-[3px] border-accent/10" />

      <div
        className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-accent border-r-accent/50 animate-spin motion-reduce:animate-none"
        style={{ animationDuration: '1.1s' }}
      />

      <div
        className="absolute inset-[8px] rounded-full border-[2px] border-transparent border-b-accent/60 animate-spin motion-reduce:animate-none"
        style={{ animationDuration: '1.6s', animationDirection: 'reverse' }}
      />

      <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(145,110,210,0.35)]" />
    </div>

    {/* Loading Label */}
    <div className="space-y-1.5">
      <p className="text-sm font-semibold tracking-wide text-text-main">
        {label}
      </p>

      <p className="text-xs text-text-muted">
        Just a moment, preparing everything
      </p>
    </div>
  </div>
);

/**
 * Empty State
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
    {Icon && (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/10 bg-accent/[0.07] text-accent">
        <Icon size={24} strokeWidth={1.8} />
      </div>
    )}

    <h3 className="text-lg font-semibold tracking-tight text-text-main">
      {title}
    </h3>

    {description && (
      <p className="max-w-md text-sm leading-relaxed text-text-muted">
        {description}
      </p>
    )}

    {action && (
      <div className="mt-3">
        {action}
      </div>
    )}
  </div>
);
