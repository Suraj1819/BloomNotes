
import { cn } from '../../lib/utils.js';

export const Card = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      // Base layout
      'group relative isolate min-w-0 overflow-hidden',

      // Shape and surface
      'rounded-[22px]',
      'border border-border/65',
      'bg-card/65 backdrop-blur-2xl',

      // Depth
      'shadow-[0_2px_8px_rgba(35,25,55,0.025),0_12px_35px_rgba(35,25,55,0.045)]',
      'dark:shadow-[0_2px_8px_rgba(0,0,0,0.10),0_12px_35px_rgba(0,0,0,0.16)]',

      // Interaction
      'transition-[border-color,box-shadow,background-color] duration-300 ease-out',
      'hover:border-accent/25',
      'hover:shadow-[0_8px_30px_rgba(80,55,120,0.075)]',
      'dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.22)]',

      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'relative flex min-w-0 items-center justify-between gap-4',
      'border-b border-border/50',
      'bg-white/[0.18] dark:bg-white/[0.015]',
      'px-5 py-4 sm:px-6 sm:py-[18px]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'relative min-w-0 px-5 py-5 sm:px-6 sm:py-6',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn(
      'min-w-0 text-[15px] font-bold',
      'leading-snug tracking-[-0.02em]',
      'text-text-main',
      className
    )}
    {...props}
  >
    {children}
  </h3>
);
