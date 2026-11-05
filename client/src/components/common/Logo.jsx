// src/components/common/Logo.jsx
export function Logo({ size = 32, withText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
        <g>
          <circle cx="20" cy="13" r="6" fill="rgb(var(--c-accent-2))" />
          <circle cx="13" cy="20" r="6" fill="rgb(var(--c-accent-2))" />
          <circle cx="27" cy="20" r="6" fill="rgb(var(--c-accent-2))" />
          <circle cx="20" cy="27" r="6" fill="rgb(var(--c-accent-2))" />
          <circle cx="20" cy="20" r="4" fill="rgb(var(--c-accent))" />
        </g>
      </svg>
      {withText && (
        <span className="font-serif text-xl font-semibold text-text-main tracking-tight">
          BloomNotes
        </span>
      )}
    </div>
  );
}
