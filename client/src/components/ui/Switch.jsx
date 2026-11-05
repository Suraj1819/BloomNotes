// src/components/ui/Switch.jsx
import { cn } from '../../lib/utils.js';

export const Switch = ({ checked, onChange, disabled, label, description }) => (
  <label className={cn('flex items-center justify-between gap-3 cursor-pointer', disabled && 'opacity-60 cursor-not-allowed')}>
    <span>
      {label && <span className="block text-sm text-text-main">{label}</span>}
      {description && <span className="block text-xs text-text-muted">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-border'
      )}
    >
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  </label>
);
