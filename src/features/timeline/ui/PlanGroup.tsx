'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Badge } from '@/shared/ui/Badge';
import { TaskGroup } from '@/features/timeline/ui/TaskGroup';
import type { TimelinePlan } from '@/entities/analysis/model';

type PlanGroupProps = {
  plan: TimelinePlan;
  sessionId?: string;
  className?: string;
};

const PHASE_STYLE: Record<string, string> = {
  research: 'italic',
  implementation: 'font-bold',
  scaffolding: 'uppercase',
  testing: 'underline',
  debugging: 'line-through',
  refinement: 'font-[300]',
  other: '',
};

export function PlanGroup({ plan, sessionId, className }: PlanGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = plan.tasks.filter((t) => t.status === 'completed').length;
  const totalCount = plan.tasks.length;
  const phaseStyle = PHASE_STYLE[plan.phase] ?? PHASE_STYLE.other;

  return (
    <div
      className={clsx('border border-border border-l-2 border-l-ember bg-depth-1 rounded-lg', className)}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-xs font-mono text-text-muted">{isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span className="flex-1 text-sm font-medium text-text-primary">{plan.name}</span>
        <span className={clsx(
          'text-[10px] font-mono px-1.5 py-0.5 bg-depth-2 text-text-secondary border border-border rounded-md',
          phaseStyle,
        )}>
          {plan.phase}
        </span>
        <span className="text-xs font-mono text-text-secondary">
          {completedCount}/{totalCount} tasks
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 py-2 space-y-0.5 bg-depth-2 depth-reveal rounded-b-lg">
          {plan.tasks.map((task, i) => (
            <TaskGroup key={`${task.name}-${i}`} task={task} sessionId={sessionId} />
          ))}
        </div>
      )}
    </div>
  );
}
