'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';
import { formatTimestamp } from '@/shared/lib/format';
import type { TimelinePlan } from '@/entities/analysis/model';

type Task = TimelinePlan['tasks'][number];

type TaskGroupProps = {
  task: Task;
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

export function TaskGroup({ task, className }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-card-border/30"
      >
        <StatusIndicator status={taskStatusToIndicator(task.status)} />
        <span className="flex-1 text-sm text-foreground">{task.name}</span>
        <Badge variant={taskStatusVariant(task.status)} size="sm">
          {task.status.replace('_', ' ')}
        </Badge>
        <span className="text-[10px] text-muted">{task.eventIds.length} events</span>
        <span className="text-xs text-muted">{isExpanded ? '-' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1 border-l border-card-border pl-3 pb-2">
          <div className="flex items-center gap-3 text-[10px] text-muted py-1">
            <span>Started: {formatTimestamp(task.startTime)}</span>
            {task.endTime && <span>Ended: {formatTimestamp(task.endTime)}</span>}
          </div>
          {task.eventIds.length > 0 && (
            <div className="text-[10px] text-muted font-mono">
              Event IDs: {task.eventIds.slice(0, 5).map((id) => id.slice(0, 8)).join(', ')}
              {task.eventIds.length > 5 && ` +${task.eventIds.length - 5} more`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
