import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  depthLevel?: 0 | 1 | 2 | 3 | 4;
};

const depthColors: Record<number, string> = {
  0: 'depth-indicator-0',
  1: 'depth-indicator-1',
  2: 'depth-indicator-2',
  3: 'depth-indicator-3',
  4: 'depth-indicator-4',
};

export function Card({ title, subtitle, children, className, onClick, depthLevel }: CardProps) {
  const isClickable = typeof onClick === 'function';

  return (
    <div
      className={cn(
        'border-t border-border bg-transparent p-5',
        'transition-colors duration-200',
        isClickable && 'cursor-pointer hover:bg-depth-1',
        depthLevel !== undefined && `depth-indicator ${depthColors[depthLevel]}`,
        className,
      )}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="mt-0.5 font-mono text-[11px] text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
