'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { SessionCard } from '@/entities/session/ui/SessionCard';
import { useSessions } from '@/features/session/model/use-session';

type SessionListProps = {
  className?: string;
};

const FILTERS = ['all', 'active', 'completed'] as const;

export function SessionList({ className }: SessionListProps) {
  const [filter, setFilter] = useState<string>('all');
  const { sessions, isLoading, error } = useSessions(filter);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs transition-colors',
              filter === f
                ? 'bg-accent/15 text-accent font-medium'
                : 'text-muted hover:text-foreground hover:bg-card-border/30',
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <span className="text-sm text-muted">Loading sessions...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-status-red/30 bg-status-red/5 p-4">
          <p className="text-sm text-status-red">Failed to load sessions: {error}</p>
        </div>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted">No sessions found.</p>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
