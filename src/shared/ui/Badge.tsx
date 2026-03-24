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
  success: 'bg-signal-green/10 text-signal-green',
  warning: 'bg-signal-amber/10 text-signal-amber',
  error: 'bg-signal-red/10 text-signal-red',
  info: 'bg-signal-blue/10 text-signal-blue',
  neutral: 'bg-sediment/15 text-silt',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ variant = 'neutral', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm font-mono font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
