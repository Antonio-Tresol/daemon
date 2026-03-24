'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { formatTimestamp } from '@/shared/lib/format';
import { TimelineEvent } from '@/features/timeline/ui/TimelineEvent';
import type { TimelinePlan } from '@/entities/analysis/model';
import type { HookEvent } from '@/entities/event/model';

type TrajectoryViewProps = {
  plans: TimelinePlan[];
  sessionId?: string;
  level?: number;
  className?: string;
};

type Orientation = 'horizontal' | 'vertical';
type Task = TimelinePlan['tasks'][number];

const PHASE_COLORS: Record<string, string> = {
  research: '#4080e5',
  implementation: '#00e5a0',
  scaffolding: '#00c5c0',
  testing: '#e5a040',
  debugging: '#e54060',
  refinement: '#8060e5',
  other: '#4a6080',
};

function getPhaseColor(phase: string): string {
  return PHASE_COLORS[phase] ?? PHASE_COLORS.other;
}

/* Monochrome SVG icons that adapt to currentColor */
function TaskIcon({ taskName, className }: { taskName: string; className?: string }) {
  const cls = cn('h-4 w-4', className);
  const lower = taskName.toLowerCase();

  if (lower.includes('read') || lower.includes('inspect') || lower.includes('search') || lower.includes('explore')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Search</title><circle cx="7" cy="7" r="4" /><path d="M10 10l4 4" /></svg>);
  }
  if (lower.includes('edit') || lower.includes('write') || lower.includes('update') || lower.includes('replace') || lower.includes('refine') || lower.includes('polish')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Edit</title><path d="M11 2l3 3-8 8H3v-3z" /><path d="M9 4l3 3" /></svg>);
  }
  if (lower.includes('test') || lower.includes('verify') || lower.includes('check') || lower.includes('health') || lower.includes('integration')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Check</title><path d="M3 8l3 3 7-7" /></svg>);
  }
  if (lower.includes('bash') || lower.includes('run') || lower.includes('npm') || lower.includes('build') || lower.includes('trigger') || lower.includes('set up')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Run</title><rect x="1" y="2" width="14" height="12" rx="2" /><path d="M4 6l3 2-3 2" /><path d="M9 10h3" /></svg>);
  }
  if (lower.includes('fix') || lower.includes('debug') || lower.includes('diagnose')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Fix</title><path d="M10 2l-1 4 4-1 1-3zM6 14l1-4-4 1-1 3z" /><path d="M5 5l6 6" /></svg>);
  }
  if (lower.includes('create') || lower.includes('scaffold') || lower.includes('install') || lower.includes('plan')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Create</title><path d="M8 3v10M3 8h10" /></svg>);
  }
  if (lower.includes('navigate') || lower.includes('screenshot') || lower.includes('preview') || lower.includes('visually')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Preview</title><circle cx="8" cy="7" r="3" /><path d="M1 7s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" /></svg>);
  }
  if (lower.includes('implement') || lower.includes('major') || lower.includes('feature')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Implement</title><path d="M4 2v12l4-3 4 3V2z" /></svg>);
  }
  if (lower.includes('agent') || lower.includes('delegate') || lower.includes('team')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Agent</title><circle cx="6" cy="5" r="2.5" /><circle cx="11" cy="5" r="2" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /></svg>);
  }
  if (lower.includes('investigate') || lower.includes('remaining') || lower.includes('issue')) {
    return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Investigate</title><circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11v.5" /></svg>);
  }
  return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Task</title><circle cx="8" cy="8" r="5" /><path d="M8 5v3h3" /></svg>);
}

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-signal-green',
  failed: 'bg-signal-red',
  in_progress: 'bg-signal-amber pulse-warning',
};

const LEVEL_LABELS = ['Events', 'Plans', 'Phases'] as const;

/* ─── Recursive Plan Card ─── */

type PlanCardProps = {
  plan: TimelinePlan;
  sessionId?: string;
  level: number;
  isNested?: boolean;
};

function PlanCard({ plan, sessionId, level, isNested }: PlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [childPlans, setChildPlans] = useState<TimelinePlan[]>([]);
  const [childEvents, setChildEvents] = useState<HookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const phaseColor = getPhaseColor(plan.phase);
  const completedCount = plan.tasks.filter((t) => t.status === 'completed').length;
  const totalEvents = plan.tasks.reduce((sum, t) => sum + t.eventIds.length, 0);

  const fetchChildren = useCallback(async () => {
    if (!sessionId || isLoading) return;
    setIsLoading(true);

    if (level > 0) {
      // Fetch level-1 plans
      try {
        const res = await fetch(`/api/analysis?sessionId=${sessionId}&type=timeline&level=${level - 1}&limit=1`);
        const data = await res.json();
        const analysis = data.analyses?.[0];
        if (analysis?.status === 'completed' && analysis?.result?.plans) {
          setChildPlans(analysis.result.plans);
        }
      } catch { /* silently fail */ }
    } else {
      // Level 0: fetch raw events for all tasks
      try {
        const allEventIds = new Set(plan.tasks.flatMap((t) => t.eventIds));
        const res = await fetch(`/api/agent/events?sessionId=${sessionId}&limit=500`);
        const data = await res.json();
        const allEvents = (data.data ?? []) as HookEvent[];
        const matched = allEvents.filter((e) => allEventIds.has(e.id));
        matched.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setChildEvents(matched);
      } catch { /* silently fail */ }
    }

    setIsLoading(false);
  }, [sessionId, level, isLoading, plan.tasks]);

  useEffect(() => {
    if (isExpanded && childPlans.length === 0 && childEvents.length === 0) {
      fetchChildren();
    }
  }, [isExpanded, childPlans.length, childEvents.length, fetchChildren]);

  return (
    <div className={cn(
      'border border-border bg-depth-1 transition-all duration-300',
      isNested ? 'ml-2' : '',
    )}
      style={{ borderLeftWidth: '2px', borderLeftColor: phaseColor }}
    >
      {/* Plan header — clickable to expand */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 p-4 text-left group"
      >
        <span className="flex-1 text-xs font-medium text-text-primary break-words">{plan.name}</span>
        <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 bg-depth-2 border border-border"
          style={{ color: phaseColor }}
        >
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

      {/* Task nodes row — always visible */}
      <div className="px-4 pb-3 flex flex-wrap gap-2 items-center">
        {plan.tasks.map((task, i) => (
          <div key={`task-${i}`} className="flex items-center gap-1.5 group/task">
            <div className="relative flex flex-col items-center gap-1">
              <div
                className="flex h-9 w-9 items-center justify-center border-2 bg-depth-0 transition-colors duration-300 group-hover/task:text-inherit"
                style={{ borderColor: phaseColor }}
              >
                <TaskIcon taskName={task.name} className="h-3.5 w-3.5 text-text-secondary group-hover/task:text-inherit" />
              </div>
              <span className={cn(
                'absolute -top-0.5 -right-0.5 h-2 w-2 border border-depth-1',
                STATUS_DOT[task.status] ?? 'bg-sediment',
              )} />
              <span className="max-w-[100px] text-[8px] font-mono text-text-muted text-center leading-tight break-words">
                {task.name}
              </span>
            </div>
            {i < plan.tasks.length - 1 && (
              <div className="h-px w-3 bg-border mb-4" />
            )}
          </div>
        ))}
      </div>

      {/* Expanded content — recursive drill-down */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3 bg-depth-2 depth-reveal">
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

/* ─── Connector SVG between plans ─── */

function PlanConnector() {
  return (
    <div className="flex justify-center py-1">
      <svg width="2" height="20" className="overflow-visible">
        <line
          x1="1" y1="0" x2="1" y2="20"
          stroke="var(--color-signal-green)"
          strokeWidth="1"
          strokeDasharray="4 4"
          strokeOpacity="0.3"
          style={{ animation: 'current-flow 1s linear infinite' }}
        />
      </svg>
    </div>
  );
}

/* ─── Main Trajectory View ─── */

export function TrajectoryView({ plans, sessionId, level = 0, className }: TrajectoryViewProps) {
  const [orientation, setOrientation] = useState<Orientation>('vertical');

  if (plans.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <span className="text-sm font-mono text-text-muted">No trajectory data.</span>
      </div>
    );
  }

  const allTasks = plans.flatMap((p) => p.tasks);
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const failedTasks = allTasks.filter((t) => t.status === 'failed').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats + orientation toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-signal-green" />
            <span>{completedTasks} completed</span>
          </div>
          {failedTasks > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-signal-red" />
              <span>{failedTasks} failed</span>
            </div>
          )}
          <span>{plans.length} plans &middot; {allTasks.length} tasks</span>

          {/* Phase legend */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            {Object.entries(PHASE_COLORS).map(([phase, color]) => {
              if (!plans.some((p) => p.phase === phase)) return null;
              return (
                <div key={phase} className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2" style={{ background: color, opacity: 0.6 }} />
                  <span className="text-[10px] font-mono">{phase}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orientation toggle */}
        <div className="flex items-center border border-border bg-depth-1">
          <button
            type="button"
            onClick={() => setOrientation('horizontal')}
            className={cn(
              'px-2.5 py-1 text-xs font-mono transition-colors duration-300',
              orientation === 'horizontal'
                ? 'bg-signal-green/10 text-signal-green font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
            title="Horizontal layout"
          >
            {'\u2194'}
          </button>
          <button
            type="button"
            onClick={() => setOrientation('vertical')}
            className={cn(
              'px-2.5 py-1 text-xs font-mono transition-colors duration-300 border-l border-border',
              orientation === 'vertical'
                ? 'bg-signal-green/10 text-signal-green font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
            title="Vertical layout"
          >
            {'\u2195'}
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div
        className={cn(
          'flex gap-4',
          orientation === 'vertical' ? 'flex-col' : 'flex-row items-start overflow-x-auto',
        )}
      >
        {plans.map((plan, i) => (
          <div key={`plan-${i}`} className={cn(orientation === 'horizontal' && 'flex-shrink-0 min-w-[300px]')}>
            {/* Connector between plans */}
            {i > 0 && orientation === 'vertical' && <PlanConnector />}
            <PlanCard
              plan={plan}
              sessionId={sessionId}
              level={level}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
