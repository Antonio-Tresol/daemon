'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';
import { LatentDivergence } from '@/shared/ui/LatentDivergence';

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
        // Non-critical sidebar fetch — session indicator is optional, safe to hide on failure
      });
  }, []);

  return (
    <aside
      className={clsx(
        'flex h-full w-56 flex-col border-r border-border bg-depth-1',
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <span className="font-serif text-lg italic text-ember">daemon</span>
        <span className="font-mono text-[9px] text-text-muted">v0.1</span>
      </div>

      {/* Navigation */}
      <nav className="mt-1 flex flex-1 flex-col">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors',
                isActive
                  ? 'border-l-ember text-ember font-medium'
                  : 'border-l-transparent text-text-secondary hover:bg-depth-2 hover:text-text-primary',
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

      {/* Latent Divergence art strip */}
      <div className="border-t border-border h-24 overflow-hidden opacity-60">
        <LatentDivergence variant="strip" agentCount={80} />
      </div>

      {/* Current Session Indicator */}
      {currentSession && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Current Session
          </p>
          <div className="flex items-center gap-2">
            <StatusIndicator status={currentSession.status === 'active' ? 'active' : 'completed'} />
            <span className="truncate font-mono text-xs font-medium text-text-primary">
              {currentSession.name ?? currentSession.id.slice(0, 12)}
            </span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-text-muted">
            {currentSession.total_events} events &middot; {formatElapsed(currentSession.start_time)}
          </p>
        </div>
      )}

      {/* Theme toggle + connection footer */}
      <div className="border-t border-border px-5 py-4 space-y-3">
        <button
          type="button"
          onClick={() => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
          }}
          className="flex items-center gap-2 font-mono text-[10px] text-text-muted hover:text-text-primary transition-colors"
        >
          <span className="inline-block h-3 w-3 rounded-sm border border-border bg-depth-2" />
          <span>Toggle theme</span>
        </button>
        <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
          <StatusIndicator status={connectedSessions > 0 ? 'active' : 'pending'} />
          <span>
            {connectedSessions} session{connectedSessions !== 1 ? 's' : ''} connected
          </span>
        </div>
      </div>
    </aside>
  );
}
