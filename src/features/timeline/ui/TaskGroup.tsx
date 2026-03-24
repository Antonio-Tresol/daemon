'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';
import { formatTimestamp } from '@/shared/lib/format';
import { TimelineEvent } from '@/features/timeline/ui/TimelineEvent';
import type { TimelinePlan } from '@/entities/analysis/model';
import type { HookEvent } from '@/entities/event/model';

type Task = TimelinePlan['tasks'][number];

type TaskGroupProps = {
  task: Task;
  sessionId?: string;
  className?: string;
};

function taskStatusToIndicator(status: Task['status']) {
  switch (status) {
    case 'completed': return 'completed' as const;
    case 'in_progress': return 'active' as const;
    case 'failed': return 'error' as const;
  }
}

function taskStatusVariant(status: Task['status']) {
  switch (status) {
    case 'completed': return 'success' as const;
    case 'in_progress': return 'info' as const;
    case 'failed': return 'error' as const;
  }
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-signal-green',
  in_progress: 'text-signal-amber',
  failed: 'text-signal-red',
};

export function TaskGroup({ task, sessionId, className }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!sessionId || task.eventIds.length === 0 || events.length > 0) return;
    setIsLoadingEvents(true);
    try {
      const res = await fetch(`/api/agent/events?sessionId=${sessionId}&limit=500`);
      const data = await res.json();
      const allEvents = (data.data ?? []) as HookEvent[];
      const eventIdSet = new Set(task.eventIds);
      const matched = allEvents.filter((e) => eventIdSet.has(e.id));
      matched.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setEvents(matched);
    } catch {
      // silently fail
    } finally {
      setIsLoadingEvents(false);
    }
  }, [sessionId, task.eventIds, events.length]);

  useEffect(() => {
    if (isExpanded && events.length === 0) {
      fetchEvents();
    }
  }, [isExpanded, events.length, fetchEvents]);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-300 hover:bg-depth-0/50"
      >
        <StatusIndicator status={taskStatusToIndicator(task.status)} />
        <span className="flex-1 text-sm text-text-primary break-words">{task.name}</span>
        <span className={cn('text-[10px] font-mono', STATUS_COLORS[task.status] ?? 'text-text-muted')}>
          {task.status.replace('_', ' ')}
        </span>
        <span className="text-[10px] font-mono text-text-muted shrink-0">{task.eventIds.length} events</span>
        <span className="text-xs text-text-muted">{isExpanded ? '\u2212' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-3 pb-2 depth-reveal">
          <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted py-1">
            <span>Started: {formatTimestamp(task.startTime)}</span>
            {task.endTime && <span>Ended: {formatTimestamp(task.endTime)}</span>}
          </div>

          {isLoadingEvents && (
            <div className="text-xs font-mono text-text-muted py-2">Loading events...</div>
          )}

          {events.length > 0 && (
            <div className="space-y-0.5">
              {events.map((event) => (
                <TimelineEvent key={event.id} event={event} />
              ))}
            </div>
          )}

          {!isLoadingEvents && events.length === 0 && task.eventIds.length > 0 && (
            <div className="text-[10px] text-text-muted font-mono py-1">
              {task.eventIds.length} event IDs (data not available for drill-down)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
