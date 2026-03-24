'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { TaskGroup } from '@/features/timeline/ui/TaskGroup';
import type { TimelinePlan } from '@/entities/analysis/model';

type PlanGroupProps = {
  plan: TimelinePlan;
  className?: string;
};

function phaseVariant(phase: TimelinePlan['phase']) {
  switch (phase) {
    case 'research': return 'info' as const;
    case 'implementation': return 'success' as const;
    case 'testing': return 'warning' as const;
    case 'debugging': return 'error' as const;
    case 'other': return 'neutral' as const;
  }
}

export function PlanGroup({ plan, className }: PlanGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = plan.tasks.filter((t) => t.status === 'completed').length;
  const totalCount = plan.tasks.length;

  return (
    <div className={cn('rounded-xl border border-card-border bg-card', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-xs text-muted">{isExpanded ? 'v' : '>'}</span>
        <span className="flex-1 text-sm font-medium text-foreground">{plan.name}</span>
        <Badge variant={phaseVariant(plan.phase)} size="sm">{plan.phase}</Badge>
        <span className="text-xs text-muted">
          {completedCount}/{totalCount} tasks
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-card-border px-4 py-2 space-y-0.5">
          {plan.tasks.map((task, i) => (
            <TaskGroup key={`${task.name}-${i}`} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
