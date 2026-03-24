'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: 'Timeline', href: '/', icon: '|' },
  { label: 'Harness', href: '/improvements', icon: '{*}' },
  { label: 'Sessions', href: '/sessions', icon: '>' },
  { label: 'Setup', href: '/setup', icon: '~' },
];

type CurrentSession = {
  id: string;
  name: string | null;
  status: string;
  total_events: number;
  start_time: string;
};

type SidebarProps = {
  connectedSessions?: number;
  className?: string;
};

function formatElapsed(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ${diffMin % 60}m ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function Sidebar({ connectedSessions = 0, className }: SidebarProps) {
  const pathname = usePathname();
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);

  useEffect(() => {
    fetch('/api/sessions?limit=1')
      .then((res) => res.json())
      .then((data: { sessions: CurrentSession[] }) => {
        const sessions = data.sessions ?? [];
        if (sessions.length > 0) {
          setCurrentSession(sessions[0]);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, []);

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

      {/* Current Session Indicator */}
      {currentSession && (
        <div className="border-t border-card-border px-4 py-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
            Current Session
          </p>
          <div className="flex items-center gap-2">
            <StatusIndicator status={currentSession.status === 'active' ? 'active' : 'completed'} />
            <span className="truncate text-xs font-medium text-foreground">
              {currentSession.name ?? currentSession.id.slice(0, 12)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            {currentSession.total_events} events &middot; {formatElapsed(currentSession.start_time)}
          </p>
        </div>
      )}

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
