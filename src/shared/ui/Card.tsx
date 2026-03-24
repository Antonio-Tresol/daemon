import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ title, subtitle, children, className, onClick }: CardProps) {
  const isClickable = typeof onClick === 'function';

  return (
    <div
      className={cn(
        'rounded-xl border border-card-border bg-card p-5',
        'transition-all duration-200',
        isClickable && 'cursor-pointer hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5',
        className,
      )}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
