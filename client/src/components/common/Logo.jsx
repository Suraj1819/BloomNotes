
export function Logo({
  size = 32,
  withText = true,
  className = '',
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {/* BloomNotes Logo Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <g>
          <circle
            cx="20"
            cy="13"
            r="6"
            fill="rgb(var(--c-accent-2))"
          />

          <circle
            cx="13"
            cy="20"
            r="6"
            fill="rgb(var(--c-accent-2))"
          />

          <circle
            cx="27"
            cy="20"
            r="6"
            fill="rgb(var(--c-accent-2))"
          />

          <circle
            cx="20"
            cy="27"
            r="6"
            fill="rgb(var(--c-accent-2))"
          />

          <circle
            cx="20"
            cy="20"
            r="4"
            fill="rgb(var(--c-accent))"
          />
        </g>
      </svg>

      {/* Brand Name */}
      {withText && (
        <span className="text-xl font-semibold tracking-tight text-text-main">
          BloomNotes
        </span>
      )}
    </div>
  );
}

export default Logo;
