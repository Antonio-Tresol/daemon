'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@/entities/session/model';
import type { HookEvent } from '@/entities/event/model';
import { fetchSessions, fetchSessionEvents } from '@/features/session/api/session-queries';

type UseSessionsReturn = {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSessions(statusFilter?: string): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchSessions(statusFilter)
      .then(setSessions)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { sessions, isLoading, error, refetch };
}

type UseSessionEventsReturn = {
  events: HookEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSessionEvents(sessionId: string, limit = 50): UseSessionEventsReturn {
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchSessionEvents(sessionId, limit)
      .then(setEvents)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setIsLoading(false));
  }, [sessionId, limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { events, isLoading, error, refetch };
}
