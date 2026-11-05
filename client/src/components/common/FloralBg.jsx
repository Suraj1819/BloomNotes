// src/components/common/FloralBg.jsx
// Decorative floral background — uses your lavender.png + soft SVG accents.
import lavenderBg from '../../../assets/background/lavender.png';

export function FloralBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
      aria-hidden="true"
    >
      {/* ===== Lavender background image (sharp, no blur) ===== */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${lavenderBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* ===== Soft readability veil (light) ===== */}
      <div
        className="absolute inset-0 dark:opacity-0 transition-opacity duration-300"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(250,240,255,0.05))',
        }}
      />

      {/* ===== Dark-mode veil (only shows in dark) ===== */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.55), rgba(20,10,30,0.5))',
        }}
      />

      {/* ===== Decorative top-right floral ===== */}
      <svg
        className="absolute -top-12 -right-12 opacity-25 dark:opacity-20"
        width="340"
        height="340"
        viewBox="0 0 200 200"
        fill="none"
      >
        <g fill="rgb(var(--c-accent-2))">
          <circle cx="100" cy="60" r="22" />
          <circle cx="60" cy="100" r="22" />
          <circle cx="140" cy="100" r="22" />
          <circle cx="100" cy="140" r="22" />
          <circle cx="100" cy="100" r="14" fill="rgb(var(--c-accent))" />
        </g>
      </svg>

      {/* ===== Decorative bottom-left floral ===== */}
      <svg
        className="absolute -bottom-20 -left-20 opacity-20 dark:opacity-15"
        width="400"
        height="400"
        viewBox="0 0 200 200"
        fill="none"
      >
        <g fill="rgb(var(--c-accent-2))">
          <circle cx="100" cy="60" r="28" />
          <circle cx="60" cy="100" r="28" />
          <circle cx="140" cy="100" r="28" />
          <circle cx="100" cy="140" r="28" />
          <circle cx="100" cy="100" r="18" fill="rgb(var(--c-accent))" />
        </g>
      </svg>

      {/* ===== Small accent petal top-left ===== */}
      <svg
        className="absolute top-24 left-8 opacity-15 hidden md:block"
        width="80"
        height="80"
        viewBox="0 0 100 100"
        fill="none"
      >
        <g fill="rgb(var(--c-accent-2))">
          <circle cx="50" cy="30" r="14" />
          <circle cx="30" cy="50" r="14" />
          <circle cx="70" cy="50" r="14" />
          <circle cx="50" cy="70" r="14" />
          <circle cx="50" cy="50" r="9" fill="rgb(var(--c-accent))" />
        </g>
      </svg>

      {/* ===== Small accent petal bottom-right ===== */}
      <svg
        className="absolute bottom-24 right-10 opacity-15 hidden md:block"
        width="70"
        height="70"
        viewBox="0 0 100 100"
        fill="none"
      >
        <g fill="rgb(var(--c-accent-2))">
          <circle cx="50" cy="30" r="12" />
          <circle cx="30" cy="50" r="12" />
          <circle cx="70" cy="50" r="12" />
          <circle cx="50" cy="70" r="12" />
          <circle cx="50" cy="50" r="8" fill="rgb(var(--c-accent))" />
        </g>
      </svg>
    </div>
  );
}

export function PetalsOverlay() {
  // Subtle floating petals. Honors floating_petals + reduced_motion via
  // CSS attribute selectors (data-reduced-motion='true' disables animations).
  const petals = Array.from({ length: 8 });

  // Slight variety so it feels organic, not mechanical
  const sizes = [10, 14, 8, 12, 16, 9, 13, 11];
  const durations = [16, 20, 14, 22, 18, 15, 24, 17];
  const delays = [0, 3, 6, 9, 2, 5, 8, 11];

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {petals.map((_, i) => (
        <span
          key={i}
          className="bn-petal"
          style={{
            left: `${(i * 13 + 4) % 100}%`,
            width: `${sizes[i]}px`,
            height: `${sizes[i]}px`,
            animationDelay: `${delays[i]}s`,
            animationDuration: `${durations[i]}s`,
          }}
        />
      ))}
    </div>
  );
}