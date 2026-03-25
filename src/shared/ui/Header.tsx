import clsx from 'clsx';
import type { ReactNode } from 'react';

type Breadcrumb = {
  label: string;
  href?: string;
};

type HeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  className?: string;
};

export function Header({ title, subtitle, breadcrumbs, actions, className }: HeaderProps) {
  return (
    <header
      className={clsx('flex items-start justify-between border-b border-border py-6', className)}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="transition-colors hover:text-text-primary">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-text-primary">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-serif italic text-text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
