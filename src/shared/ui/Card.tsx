import clsx from 'clsx';
import type { ReactNode } from 'react';

type BorderAccent = 'ember' | 'none';

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  depthLevel?: 0 | 1 | 2 | 3 | 4;
  borderAccent?: BorderAccent;
};

const depthColors: Record<number, string> = {
  0: 'depth-indicator-0',
  1: 'depth-indicator-1',
  2: 'depth-indicator-2',
  3: 'depth-indicator-3',
  4: 'depth-indicator-4',
};

const accentStyles: Record<BorderAccent, string> = {
  ember: 'border-l-[3px] border-l-ember',
  none: '',
};

export function Card({
  title,
  subtitle,
  children,
  className,
  onClick,
  depthLevel,
  borderAccent = 'none',
}: CardProps) {
  const isClickable = typeof onClick === 'function';

  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-depth-1 p-5',
        'transition-colors duration-200',
        isClickable && 'cursor-pointer hover:bg-depth-2',
        depthLevel !== undefined && `depth-indicator ${depthColors[depthLevel]}`,
        accentStyles[borderAccent],
        className,
      )}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter') onClick();
            }
          : undefined
      }
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
          {subtitle && (
            <p className="mt-0.5 font-mono text-[11px] text-text-secondary">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
