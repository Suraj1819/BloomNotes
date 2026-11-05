// src/components/ui/Button.jsx
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const variants = {
  primary: 'bg-accent text-white hover:bg-accent/90 shadow-soft',
  outline: 'border border-border text-text-main hover:bg-highlight',
  ghost:   'text-text-main hover:bg-highlight',
  danger:  'bg-red-500 text-white hover:bg-red-600 shadow-soft',
  subtle:  'bg-highlight text-text-main hover:bg-highlight/80',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
  icon: 'p-2',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', loading = false, disabled, children, ...props },
  ref
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-xl2 font-medium transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'active:scale-[0.97]',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />}
      {children}
    </button>
  );
});
