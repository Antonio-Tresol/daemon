import { useCallback, useEffect, useState } from 'react';
import type { HookEvent } from '@/entities/event/model';

type UseMatchedEventsOptions = {
  sessionId?: string;
  eventIds: string[];
  enabled?: boolean;
};

type UseMatchedEventsResult = {
  events: HookEvent[];
  isLoading: boolean;
};

export function useMatchedEvents({
  sessionId,
  eventIds,
  enabled = true,
}: UseMatchedEventsOptions): UseMatchedEventsResult {
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!sessionId || eventIds.length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agent/events?sessionId=${sessionId}&limit=500`);
      const data: { data?: HookEvent[] } = await res.json();
      const allEvents = data.data ?? [];
      const eventIdSet = new Set(eventIds);
      const matched = allEvents.filter((e) => eventIdSet.has(e.id));
      matched.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setEvents(matched);
    } catch {
      // silently fail — events are supplementary data
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, eventIds]);

  useEffect(() => {
    if (enabled && events.length === 0) {
      fetchEvents();
    }
  }, [enabled, events.length, fetchEvents]);

  return { events, isLoading };
}
