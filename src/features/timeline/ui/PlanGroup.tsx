'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { TaskGroup } from '@/features/timeline/ui/TaskGroup';
import type { TimelinePlan } from '@/entities/analysis/model';

type PlanGroupProps = {
  plan: TimelinePlan;
  sessionId?: string;
  className?: string;
};

const PHASE_COLORS: Record<string, string> = {
  research: '#4080e5',
  implementation: '#00e5a0',
  scaffolding: '#00c5c0',
  testing: '#e5a040',
  debugging: '#e54060',
  refinement: '#8060e5',
  other: '#4a6080',
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

export function PlanGroup({ plan, sessionId, className }: PlanGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = plan.tasks.filter((t) => t.status === 'completed').length;
  const totalCount = plan.tasks.length;
  const phaseColor = PHASE_COLORS[plan.phase] ?? PHASE_COLORS.other;

  return (
    <div
      className={cn('border border-border bg-depth-1', className)}
      style={{ borderLeftWidth: '2px', borderLeftColor: phaseColor }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-xs font-mono text-text-muted">{isExpanded ? '\u25BC' : '\u25B6'}</span>
        <span className="flex-1 text-sm font-medium text-text-primary">{plan.name}</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-depth-2 border border-border"
          style={{ color: phaseColor }}
        >
          {plan.phase}
        </span>
        <span className="text-xs font-mono text-text-secondary">
          {completedCount}/{totalCount} tasks
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 py-2 space-y-0.5 bg-depth-2">
          {plan.tasks.map((task, i) => (
            <TaskGroup key={`${task.name}-${i}`} task={task} sessionId={sessionId} />
          ))}
        </div>
      )}
    </div>
  );
}
