'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { formatTimestamp } from '@/shared/lib/format';
import type { TimelinePlan } from '@/entities/analysis/model';

type TrajectoryViewProps = {
  plans: TimelinePlan[];
  className?: string;
};

type Orientation = 'horizontal' | 'vertical';

type Task = TimelinePlan['tasks'][number];

const PHASE_COLORS: Record<TimelinePlan['phase'], string> = {
  research: '#6b8aed',
  implementation: '#4a9e6d',
  testing: '#d4a040',
  debugging: '#c45a5a',
  other: '#8a8078',
};

const PHASE_BG: Record<TimelinePlan['phase'], string> = {
  research: 'bg-blue-500/8 border-blue-500/20',
  implementation: 'bg-status-green/8 border-status-green/20',
  testing: 'bg-status-amber/8 border-status-amber/20',
  debugging: 'bg-status-red/8 border-status-red/20',
  other: 'bg-muted/8 border-muted/20',
};

function getTaskIcon(taskName: string): string {
  const lower = taskName.toLowerCase();
  if (lower.includes('read') || lower.includes('inspect') || lower.includes('search')) return '\u{1F50D}';
  if (lower.includes('edit') || lower.includes('replace') || lower.includes('write') || lower.includes('update')) return '\u{270F}\uFE0F';
  if (lower.includes('test') || lower.includes('verify') || lower.includes('check') || lower.includes('health')) return '\u2705';
  if (lower.includes('bash') || lower.includes('run') || lower.includes('npm') || lower.includes('build') || lower.includes('trigger')) return '\u25B6\uFE0F';
  if (lower.includes('commit') || lower.includes('git') || lower.includes('stage')) return '\u{1F4BE}';
  if (lower.includes('navigate') || lower.includes('screenshot') || lower.includes('preview') || lower.includes('visually')) return '\u{1F441}\uFE0F';
  if (lower.includes('fix') || lower.includes('debug') || lower.includes('diagnose')) return '\u{1F527}';
  if (lower.includes('create') || lower.includes('scaffold') || lower.includes('install') || lower.includes('plan')) return '\u2795';
  if (lower.includes('report') || lower.includes('confirm') || lower.includes('todo') || lower.includes('explain')) return '\u{1F4CB}';
  if (lower.includes('delete') || lower.includes('remove')) return '\u{1F5D1}\uFE0F';
  if (lower.includes('send') || lower.includes('curl') || lower.includes('fetch') || lower.includes('api')) return '\u{1F4E1}';
  if (lower.includes('list') || lower.includes('session')) return '\u{1F4C4}';
  return '\u25CF';
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'border-status-green text-status-green';
    case 'failed': return 'border-status-red text-status-red';
    case 'in_progress': return 'border-blue-400 text-blue-400';
    default: return 'border-muted text-muted';
  }
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'completed': return 'success' as const;
    case 'failed': return 'error' as const;
    case 'in_progress': return 'info' as const;
    default: return 'neutral' as const;
  }
}

type TaskNodeProps = {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
};

function TaskNode({ task, isSelected, onSelect }: TaskNodeProps) {
  const icon = getTaskIcon(task.name);
  const isFailed = task.status === 'failed';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex flex-col items-center gap-1.5 transition-all',
        isSelected && 'scale-110',
      )}
    >
      <span className="text-[9px] text-muted">{task.eventIds.length}e</span>
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card transition-all',
          statusColor(task.status),
          isSelected && 'ring-2 ring-accent/40 ring-offset-1 ring-offset-background',
          isFailed && 'border-dashed',
          'group-hover:ring-2 group-hover:ring-accent/20',
        )}
      >
        <span className="text-base leading-none">{icon}</span>
      </div>
      <span className="max-w-[140px] text-[9px] text-muted group-hover:text-foreground transition-colors text-center leading-tight break-words">
        {task.name}
      </span>
    </button>
  );
}

type TaskDetailPanelProps = {
  task: Task;
  planName: string;
  onClose: () => void;
};

function TaskDetailPanel({ task, planName, onClose }: TaskDetailPanelProps) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTaskIcon(task.name)}</span>
          <h4 className="text-sm font-medium text-foreground">{task.name}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          x
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted">Status</span>
          <div className="mt-0.5">
            <Badge variant={statusBadgeVariant(task.status)} size="sm">
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted">Plan</span>
          <p className="mt-0.5 text-foreground/80">{planName}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted">Started</span>
          <p className="mt-0.5 text-foreground/80 font-mono">{formatTimestamp(task.startTime)}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted">Ended</span>
          <p className="mt-0.5 text-foreground/80 font-mono">
            {task.endTime ? formatTimestamp(task.endTime) : 'In progress'}
          </p>
        </div>
        <div className="col-span-2">
          <span className="text-[10px] uppercase tracking-wider text-muted">Events ({task.eventIds.length})</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {task.eventIds.map((id) => (
              <span key={id} className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[9px] text-muted">
                {id.slice(0, 8)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrajectoryView({ plans, className }: TrajectoryViewProps) {
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [selectedTask, setSelectedTask] = useState<{ task: Task; planName: string } | null>(null);

  if (plans.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <span className="text-sm text-muted">No trajectory data.</span>
      </div>
    );
  }

  const allTasks = plans.flatMap((p) => p.tasks);
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const failedTasks = allTasks.filter((t) => t.status === 'failed').length;

  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats + orientation toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-green" />
            <span>{completedTasks} completed</span>
          </div>
          {failedTasks > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-red" />
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
                  <span className="inline-block h-2 w-2 rounded" style={{ background: color, opacity: 0.6 }} />
                  <span className="text-[10px]">{phase}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orientation toggle */}
        <div className="flex items-center rounded-lg border border-card-border bg-card">
          <button
            type="button"
            onClick={() => setOrientation('horizontal')}
            className={cn(
              'px-2.5 py-1 text-xs transition-colors rounded-l-lg',
              orientation === 'horizontal'
                ? 'bg-accent/15 text-accent font-medium'
                : 'text-muted hover:text-foreground',
            )}
            title="Horizontal layout"
          >
            {'\u2194'}
          </button>
          <button
            type="button"
            onClick={() => setOrientation('vertical')}
            className={cn(
              'px-2.5 py-1 text-xs transition-colors rounded-r-lg border-l border-card-border',
              orientation === 'vertical'
                ? 'bg-accent/15 text-accent font-medium'
                : 'text-muted hover:text-foreground',
            )}
            title="Vertical layout"
          >
            {'\u2195'}
          </button>
        </div>
      </div>

      {/* Trajectory flow */}
      <div
        className={cn(
          'rounded-xl border border-card-border bg-card p-6',
          isHorizontal ? 'overflow-x-auto' : 'overflow-y-auto max-h-[70vh]',
        )}
      >
        <div
          className={cn(
            'flex gap-6',
            isHorizontal ? 'flex-row items-start' : 'flex-col',
          )}
        >
          {plans.map((plan, planIndex) => {
            const phaseColor = PHASE_COLORS[plan.phase];
            const completedCount = plan.tasks.filter((t) => t.status === 'completed').length;

            return (
              <div key={`plan-${planIndex}`} className="flex-shrink-0">
                {/* Plan connector */}
                {planIndex > 0 && (
                  <div
                    className={cn(
                      'flex items-center justify-center',
                      isHorizontal ? 'hidden' : 'py-2',
                    )}
                  >
                    <div className="h-6 w-px border-l-2 border-dashed border-accent/30" />
                  </div>
                )}

                {/* Plan container */}
                <div className={cn('rounded-xl border p-4', PHASE_BG[plan.phase])}>
                  {/* Plan header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: phaseColor }}
                    />
                    <span className="text-xs font-medium text-foreground">{plan.name}</span>
                    <Badge variant="neutral" size="sm">{plan.phase}</Badge>
                    <span className="text-[10px] text-muted ml-auto">
                      {completedCount}/{plan.tasks.length}
                    </span>
                  </div>

                  {/* Tasks flow */}
                  <div
                    className={cn(
                      'flex gap-2 items-center',
                      isHorizontal ? 'flex-row' : 'flex-col',
                    )}
                  >
                    {plan.tasks.map((task, taskIndex) => {
                      const isSelected =
                        selectedTask?.task === task &&
                        selectedTask?.planName === plan.name;

                      return (
                        <div
                          key={`task-${planIndex}-${taskIndex}`}
                          className={cn(
                            'flex items-center gap-2',
                            isHorizontal ? 'flex-row' : 'flex-col',
                          )}
                        >
                          <TaskNode
                            task={task}
                            isSelected={isSelected}
                            onSelect={() =>
                              setSelectedTask(
                                isSelected ? null : { task, planName: plan.name },
                              )
                            }
                          />
                          {/* Connector between tasks */}
                          {taskIndex < plan.tasks.length - 1 && (
                            <div
                              className={cn(
                                isHorizontal
                                  ? 'h-px w-4 bg-muted/30'
                                  : 'w-px h-4 bg-muted/30',
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Horizontal plan connector */}
                {isHorizontal && planIndex < plans.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected task detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask.task}
          planName={selectedTask.planName}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
