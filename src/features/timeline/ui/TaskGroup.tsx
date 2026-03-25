'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';
import { LoadingState } from '@/shared/ui/LoadingState';
import { formatTimestamp } from '@/shared/lib/format';
import { TimelineEvent } from '@/features/timeline/ui/TimelineEvent';
import { useMatchedEvents } from '@/features/timeline/hooks/use-matched-events';
import type { TimelinePlan } from '@/entities/analysis/model';

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

const STATUS_SYMBOLS: Record<string, { symbol: string; className: string }> = {
  completed: { symbol: '\u2713', className: 'text-text-secondary' },
  in_progress: { symbol: '\u25CF', className: 'text-ember animate-pulse' },
  failed: { symbol: '\u2717', className: 'text-text-primary' },
};

export function TaskGroup({ task, sessionId, className }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { events, isLoading: isLoadingEvents } = useMatchedEvents({
    sessionId,
    eventIds: task.eventIds,
    enabled: isExpanded,
  });

  const statusInfo = STATUS_SYMBOLS[task.status] ?? { symbol: '\u25CC', className: 'text-text-muted' };

  return (
    <div className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-300 hover:bg-depth-0/50"
      >
        <StatusIndicator status={taskStatusToIndicator(task.status)} />
        <span className="flex-1 text-sm text-text-primary break-words">{task.name}</span>
        <span className={clsx('text-[10px] font-mono', statusInfo.className)}>
          {statusInfo.symbol} {task.status.replace('_', ' ')}
        </span>
        <span className="text-[10px] font-mono text-text-muted shrink-0">{task.eventIds.length} events</span>
        <span className="text-xs text-text-muted">{isExpanded ? '\u2212' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-3 pb-2 depth-reveal rounded-md">
          <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted py-1">
            <span>Started: {formatTimestamp(task.startTime)}</span>
            {task.endTime && <span>Ended: {formatTimestamp(task.endTime)}</span>}
          </div>

          {isLoadingEvents && <LoadingState message="Loading events..." className="py-2" />}

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
