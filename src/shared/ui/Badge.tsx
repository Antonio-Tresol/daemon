import clsx from 'clsx';
import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
};

/** Map all variants to just two visual styles: neutral and accent */
const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-depth-2 text-text-secondary',
  success: 'bg-depth-2 text-text-secondary',
  info: 'bg-depth-2 text-text-secondary',
  accent: 'bg-ember/15 text-ember',
  error: 'bg-ember/15 text-ember',
  warning: 'bg-ember/15 text-ember',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-[10px]',
};

export function Badge({ variant = 'neutral', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md font-mono font-medium uppercase tracking-wider',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
