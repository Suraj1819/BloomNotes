// src/components/ui/Select.jsx
import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl2 border border-border bg-input px-3 py-2 text-sm text-text-main',
        'focus:border-accent focus:outline-none transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
