
import { useAuth } from '../../contexts/AuthContext.jsx';

const PETALS = [
  { left: '4%', size: 15, duration: 19, delay: -5, drift: 75, rotate: 220 },
  { left: '11%', size: 11, duration: 24, delay: -14, drift: -55, rotate: 160 },
  { left: '19%', size: 18, duration: 22, delay: -9, drift: 90, rotate: 260 },
  { left: '27%', size: 12, duration: 26, delay: -19, drift: -75, rotate: 190 },
  { left: '36%', size: 16, duration: 20, delay: -3, drift: 65, rotate: 230 },
  { left: '44%', size: 10, duration: 25, delay: -16, drift: -65, rotate: 180 },
  { left: '53%', size: 17, duration: 23, delay: -11, drift: 80, rotate: 250 },
  { left: '62%', size: 12, duration: 21, delay: -7, drift: -85, rotate: 200 },
  { left: '71%', size: 15, duration: 27, delay: -21, drift: 70, rotate: 240 },
  { left: '80%', size: 11, duration: 22, delay: -12, drift: -60, rotate: 170 },
  { left: '89%', size: 18, duration: 24, delay: -17, drift: 85, rotate: 270 },
  { left: '96%', size: 12, duration: 20, delay: -2, drift: -70, rotate: 210 },
];

export function FloatingPetals() {
  const { profile } = useAuth();

  const enabled = profile?.floating_petals ?? true;

  const intensity = Math.min(
    100,
    Math.max(0, Number(profile?.floral_intensity ?? 60))
  );

  const reducedMotion = Boolean(profile?.reduced_motion);

  if (!enabled || intensity === 0) {
    return null;
  }

  const opacity = (intensity / 100) * 0.72;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      style={{
        contain: 'strict',
        opacity,
      }}
    >
      <style>{`
        @keyframes bloomnotes-petal-fall {
          0% {
            transform:
              translate3d(0, -10vh, 0)
              rotate(0deg);
          }

          25% {
            transform:
              translate3d(25px, 25vh, 0)
              rotate(90deg);
          }

          50% {
            transform:
              translate3d(-20px, 55vh, 0)
              rotate(180deg);
          }

          75% {
            transform:
              translate3d(30px, 80vh, 0)
              rotate(270deg);
          }

          100% {
            transform:
              translate3d(0, 115vh, 0)
              rotate(360deg);
          }
        }

        .bloomnotes-petal {
          position: absolute;
          top: 0;
          display: block;
          border-radius: 100% 0 100% 0;
          background: linear-gradient(
            135deg,
            rgba(255, 220, 238, 0.95),
            rgba(213, 160, 210, 0.75)
          );
          box-shadow: 0 2px 10px rgba(180, 120, 170, 0.12);
          will-change: transform;
          animation-name: bloomnotes-petal-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .bloomnotes-petal {
            animation: none !important;
            display: none !important;
          }
        }
      `}</style>

      {PETALS.map((petal, index) => (
        <span
          key={index}
          className="bloomnotes-petal"
          style={{
            left: petal.left,
            width: `${petal.size}px`,
            height: `${petal.size * 1.45}px`,
            opacity: reducedMotion ? 0 : 1,
            animationDuration: `${petal.duration}s`,
            animationDelay: `${petal.delay}s`,
            transform: `translateX(${petal.drift}px) rotate(${petal.rotate}deg)`,
            animationPlayState: reducedMotion ? 'paused' : 'running',
          }}
        />
      ))}
    </div>
  );
}
