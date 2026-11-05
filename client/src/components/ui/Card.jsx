// src/components/ui/Card.jsx
import { cn } from '../../lib/utils.js';

export const Card = ({ className, children, ...props }) => (
  <div className={cn('bg-card border border-border rounded-xl2 shadow-card', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }) => (
  <div className={cn('px-5 py-4 border-b border-border', className)}>{children}</div>
);

export const CardBody = ({ className, children }) => (
  <div className={cn('px-5 py-4', className)}>{children}</div>
);

export const CardTitle = ({ className, children }) => (
  <h3 className={cn('text-base font-semibold text-text-main', className)}>{children}</h3>
);
