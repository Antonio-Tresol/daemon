import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-status-green/15 text-status-green',
  warning: 'bg-status-amber/15 text-status-amber',
  error: 'bg-status-red/15 text-status-red',
  info: 'bg-accent/15 text-accent',
  neutral: 'bg-muted/15 text-muted',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ variant = 'neutral', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
