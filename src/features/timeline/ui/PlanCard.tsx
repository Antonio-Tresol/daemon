'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { TimelineEvent } from '@/features/timeline/ui/TimelineEvent';
import { TaskIcon } from '@/features/timeline/ui/TaskIcon';
import { StatusSymbol } from '@/features/timeline/ui/StatusSymbol';
import { useMatchedEvents } from '@/features/timeline/hooks/use-matched-events';
import type { TimelinePlan } from '@/entities/analysis/model';

const PHASE_STYLE: Record<string, string> = {
  research: 'italic',
  implementation: 'font-bold',
  scaffolding: 'uppercase',
  testing: 'underline',
  debugging: 'line-through',
  refinement: 'font-[300]',
  other: '',
};

const LEVEL_LABELS = ['Events', 'Plans', 'Phases'] as const;

export type PlanCardProps = {
  plan: TimelinePlan;
  sessionId?: string;
  level: number;
  isNested?: boolean;
};

export function PlanCard({ plan, sessionId, level, isNested }: PlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [childPlans, setChildPlans] = useState<TimelinePlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const phaseStyle = PHASE_STYLE[plan.phase] ?? PHASE_STYLE.other;
  const completedCount = plan.tasks.filter((t) => t.status === 'completed').length;
  const totalEvents = plan.tasks.reduce((sum, t) => sum + t.eventIds.length, 0);

  const allEventIds = useMemo(
    () => plan.tasks.flatMap((t) => t.eventIds),
    [plan.tasks],
  );

  const { events: childEvents, isLoading: isLoadingEvents } = useMatchedEvents({
    sessionId,
    eventIds: allEventIds,
    enabled: isExpanded && level === 0,
  });

  const fetchChildPlans = useCallback(async () => {
    if (!sessionId || isLoadingPlans || level <= 0) return;
    setIsLoadingPlans(true);
    try {
      const res = await fetch(`/api/analysis?sessionId=${sessionId}&type=timeline&level=${level - 1}&limit=1`);
      const data: { analyses?: Array<{ status: string; result?: { plans?: TimelinePlan[] } }> } = await res.json();
      const analysis = data.analyses?.[0];
      if (analysis?.status === 'completed' && analysis?.result?.plans) {
        setChildPlans(analysis.result.plans);
      }
    } catch { /* silently fail */ }
    setIsLoadingPlans(false);
  }, [sessionId, level, isLoadingPlans]);

  useEffect(() => {
    if (isExpanded && level > 0 && childPlans.length === 0) {
      fetchChildPlans();
    }
  }, [isExpanded, level, childPlans.length, fetchChildPlans]);

  const isLoading = level > 0 ? isLoadingPlans : isLoadingEvents;

  return (
    <div className={clsx(
      'border border-border border-l-2 border-l-ember bg-depth-1 rounded-lg transition-all duration-300',
      isNested ? 'ml-2' : '',
    )}>
      {/* Plan header — clickable to expand */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 p-4 text-left group"
      >
        <span className="flex-1 text-sm font-serif italic text-text-primary break-words">{plan.name}</span>
        <span className={clsx(
          'text-[10px] font-mono px-1.5 py-0.5 bg-depth-2 text-text-secondary border border-border rounded-md',
          phaseStyle,
        )}>
          {plan.phase}
        </span>
        <span className="text-[10px] font-mono text-text-secondary shrink-0">
          {completedCount}/{plan.tasks.length}
        </span>
        {level > 0 && (
          <span className="text-[10px] font-mono text-text-muted shrink-0">
            {totalEvents}e
          </span>
        )}
        <span className="text-xs text-text-muted group-hover:text-text-primary transition-colors duration-300">
          {isExpanded ? '\u25BC' : '\u25B6'}
        </span>
      </button>

      {/* Task nodes row — click to expand */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
        className="px-4 pb-3 flex flex-wrap gap-2 items-center cursor-pointer">
        {plan.tasks.map((task, i) => (
          <div key={`task-${i}`} className="flex items-center gap-1.5 group/task">
            <div className="relative flex flex-col items-center gap-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ember bg-depth-0 transition-colors duration-300 group-hover/task:text-inherit">
                <TaskIcon taskName={task.name} className="h-3.5 w-3.5 text-text-secondary group-hover/task:text-inherit" />
              </div>
              <span className="absolute -top-1 -right-1 flex items-center justify-center">
                <StatusSymbol status={task.status} />
              </span>
              <span className="max-w-[100px] text-[8px] font-mono text-text-muted text-center leading-tight break-words">
                {task.name}
              </span>
            </div>
            {i < plan.tasks.length - 1 && (
              <div className="h-0.5 w-4 bg-ember/30 mb-4 rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Expanded content — recursive drill-down */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3 bg-depth-2 depth-reveal rounded-b-lg">
          {isLoading && (
            <div className="text-xs font-mono text-text-muted py-2">
              Loading {level > 0 ? LEVEL_LABELS[level - 1] ?? 'data' : 'events'}...
            </div>
          )}

          {/* Level > 0: show child plans recursively */}
          {level > 0 && childPlans.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-mono">
                {LEVEL_LABELS[level - 1] ?? `Level ${level - 1}`} ({childPlans.length})
              </span>
              <div className="space-y-2">
                {childPlans.map((childPlan, i) => (
                  <PlanCard
                    key={`child-${i}`}
                    plan={childPlan}
                    sessionId={sessionId}
                    level={level - 1}
                    isNested
                  />
                ))}
              </div>
            </div>
          )}

          {/* Level 0: show raw events */}
          {level === 0 && childEvents.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-mono">
                Events ({childEvents.length})
              </span>
              <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
                {childEvents.map((event) => (
                  <TimelineEvent key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && level > 0 && childPlans.length === 0 && (
            <div className="text-xs font-mono text-text-muted py-1">
              No Level {level - 1} analysis available. Run Level {level - 1} first.
            </div>
          )}

          {!isLoading && level === 0 && childEvents.length === 0 && (
            <div className="text-xs font-mono text-text-muted py-1">
              No events available for drill-down.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
