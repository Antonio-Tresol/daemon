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
              'px-3 py-1.5 text-xs font-mono transition-colors',
              filter === f
                ? 'bg-signal-green/15 text-signal-green font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-border/30',
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
        <div className="border border-signal-red/30 bg-signal-red/5 p-4">
          <p className="text-sm text-signal-red">Failed to load sessions: {error}</p>
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
