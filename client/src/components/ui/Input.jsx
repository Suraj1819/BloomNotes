
import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const controlBase = [
  'w-full min-w-0 rounded-xl border border-border/70',
  'bg-white/70 dark:bg-[#302b38]/55',
  'text-sm text-text-main',
  'placeholder:text-text-muted/80',
  'transition-all duration-200 ease-out',
  'hover:border-accent/35',
  'focus:border-accent/60 focus:outline-none',
  'focus:ring-[3px] focus:ring-accent/10',
  'disabled:cursor-not-allowed disabled:opacity-55',
  'disabled:hover:border-border/70',
];

export const Input = forwardRef(function Input(
  { className, type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        controlBase,
        'h-11 px-3.5',
        'file:mr-3 file:rounded-lg file:border-0',
        'file:bg-accent/10 file:px-3 file:py-1.5',
        'file:text-xs file:font-semibold file:text-accent',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { className, rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        controlBase,
        'min-h-[110px] resize-y px-3.5 py-3',
        'leading-relaxed',
        className
      )}
      {...props}
    />
  );
});

export const Label = ({
  className,
  children,
  htmlFor,
  ...props
}) => (
  <label
    htmlFor={htmlFor}
    className={cn(
      'mb-2 block text-[12px] font-semibold',
      'tracking-[0.01em] text-text-main',
      className
    )}
    {...props}
  >
    {children}
  </label>
);

export const Field = ({
  label,
  error,
  children,
  hint,
  className,
  id,
}) => (
  <div className={cn('min-w-0 space-y-1.5', className)}>
    {label && (
      <Label htmlFor={id}>
        {label}
      </Label>
    )}

    {children}

    {hint && !error && (
      <p className="text-[11px] leading-relaxed text-text-muted">
        {hint}
      </p>
    )}

    {error && (
      <p
        className="flex items-center gap-1.5 text-[11px] font-medium text-red-500"
        role="alert"
      >
        {error}
      </p>
    )}
  </div>
);
