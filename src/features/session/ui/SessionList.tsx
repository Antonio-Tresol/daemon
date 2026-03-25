'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { SessionCard } from '@/entities/session/ui/SessionCard';
import { useSessions } from '@/features/session/model/use-session';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';

type SessionListProps = {
  className?: string;
};

const FILTERS = ['all', 'active', 'completed'] as const;

export function SessionList({ className }: SessionListProps) {
  const [filter, setFilter] = useState<string>('all');
  const { sessions, isLoading, error } = useSessions(filter);

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 text-xs font-mono rounded-md transition-colors',
              filter === f
                ? 'bg-ember/15 text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-border/30',
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <LoadingState message="Loading sessions..." />}

      {error && <ErrorState message={`Failed to load sessions: ${error}`} />}

      {!isLoading && !error && sessions.length === 0 && <EmptyState message="No sessions found." />}

      <div className="space-y-2">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
