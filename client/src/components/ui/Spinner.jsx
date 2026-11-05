// src/components/ui/Spinner.jsx
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const Spinner = ({ className, size = 16 }) => (
  <Loader2 size={size} className={cn('animate-spin', className)} />
);

export const PageLoader = ({ label = 'Loading…' }) => (
  <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-text-muted">
    <Spinner size={28} className="text-accent" />
    <p className="text-sm">{label}</p>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    {Icon && (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-highlight text-accent">
        <Icon size={24} />
      </div>
    )}
    <h3 className="text-lg font-semibold text-text-main">{title}</h3>
    {description && <p className="max-w-md text-sm text-text-muted">{description}</p>}
    {action}
  </div>
);
