// src/components/ui/Input.jsx
import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl2 border border-border bg-input px-3 py-2 text-sm text-text-main',
        'placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors',
        'disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl2 border border-border bg-input px-3 py-2 text-sm text-text-main',
        'placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors resize-y',
        className
      )}
      {...props}
    />
  );
});

export const Label = ({ className, children, ...props }) => (
  <label className={cn('block text-xs font-medium text-text-muted mb-1.5', className)} {...props}>
    {children}
  </label>
);

export const Field = ({ label, error, children, hint }) => (
  <div>
    {label && <Label>{label}</Label>}
    {children}
    {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);
