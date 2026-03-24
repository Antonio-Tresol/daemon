'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: 'Timeline', href: '/', icon: '|' },
  { label: 'Failures', href: '/failures', icon: '!' },
  { label: 'Harness', href: '/improvements', icon: '{*}' },
  { label: 'Sessions', href: '/sessions', icon: '>' },
];

type SidebarProps = {
  connectedSessions?: number;
  className?: string;
};

export function Sidebar({ connectedSessions = 0, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full w-56 flex-col border-r border-card-border bg-card',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
          <span className="text-sm font-bold text-accent">CC</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Command Center</h1>
          <p className="text-[10px] text-muted">Claude Monitor</p>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-muted hover:bg-card-border/50 hover:text-foreground',
              )}
            >
              <span className="w-4 text-center font-mono text-xs opacity-60">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-card-border px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <StatusIndicator status={connectedSessions > 0 ? 'active' : 'pending'} />
          <span>
            {connectedSessions} session{connectedSessions !== 1 ? 's' : ''} connected
          </span>
        </div>
      </div>
    </aside>
  );
}
