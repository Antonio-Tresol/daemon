'use client';

import { cn } from '@/shared/lib/cn';
import type { TimelinePlan } from '@/entities/analysis/model';

type TrajectoryViewProps = {
  plans: TimelinePlan[];
  className?: string;
};

const PHASE_COLORS: Record<TimelinePlan['phase'], string> = {
  research: '#6b8aed',
  implementation: '#4a9e6d',
  testing: '#d4a040',
  debugging: '#c45a5a',
  other: '#8a8078',
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#4a9e6d',
  in_progress: '#6b8aed',
  failed: '#c45a5a',
};

function getTaskIcon(taskName: string): string {
  const lower = taskName.toLowerCase();
  if (lower.includes('read') || lower.includes('inspect')) return '\u{1F50D}';
  if (lower.includes('edit') || lower.includes('replace') || lower.includes('write')) return '\u{270F}';
  if (lower.includes('test') || lower.includes('verify') || lower.includes('check')) return '\u{2714}';
  if (lower.includes('bash') || lower.includes('run') || lower.includes('npm') || lower.includes('build')) return '\u{25B6}';
  if (lower.includes('commit') || lower.includes('git') || lower.includes('stage')) return '\u{1F4BE}';
  if (lower.includes('navigate') || lower.includes('screenshot') || lower.includes('preview')) return '\u{1F5BC}';
  if (lower.includes('fix') || lower.includes('debug') || lower.includes('diagnose')) return '\u{1F527}';
  if (lower.includes('create') || lower.includes('scaffold') || lower.includes('install')) return '\u{2795}';
  if (lower.includes('report') || lower.includes('confirm') || lower.includes('update todo')) return '\u{1F4CB}';
  if (lower.includes('delete') || lower.includes('remove')) return '\u{1F5D1}';
  return '\u{25CF}';
}

export function TrajectoryView({ plans, className }: TrajectoryViewProps) {
  if (plans.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <span className="text-sm text-muted">No trajectory data.</span>
      </div>
    );
  }

  // Calculate total events and layout
  const allTasks = plans.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const failedTasks = allTasks.filter((t) => t.status === 'failed').length;

  // SVG dimensions
  const nodeRadius = 18;
  const planPadding = 24;
  const taskSpacing = 52;
  const planGap = 40;

  // Calculate plan widths
  const planWidths = plans.map((p) =>
    planPadding * 2 + Math.max(1, p.tasks.length) * taskSpacing
  );
  const totalWidth = planWidths.reduce((a, b) => a + b, 0) + (plans.length - 1) * planGap + 80;
  const svgHeight = 200;
  const centerY = svgHeight / 2;

  let offsetX = 40;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#4a9e6d' }} />
          <span>{completedTasks} completed</span>
        </div>
        {failedTasks > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#c45a5a' }} />
            <span>{failedTasks} failed</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span>{plans.length} plans</span>
          <span className="text-card-border">/</span>
          <span>{totalTasks} tasks</span>
        </div>

        {/* Phase legend */}
        <div className="ml-auto flex items-center gap-3">
          {Object.entries(PHASE_COLORS).map(([phase, color]) => {
            const hasPlan = plans.some((p) => p.phase === phase);
            if (!hasPlan) return null;
            return (
              <div key={phase} className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded" style={{ background: color, opacity: 0.6 }} />
                <span className="text-[10px]">{phase}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trajectory graph */}
      <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
        <svg
          width={Math.max(totalWidth, 600)}
          height={svgHeight}
          viewBox={`0 0 ${Math.max(totalWidth, 600)} ${svgHeight}`}
          className="w-full"
          style={{ minWidth: totalWidth }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {plans.map((plan, planIndex) => {
            const planWidth = planWidths[planIndex];
            const planX = offsetX;
            const phaseColor = PHASE_COLORS[plan.phase];

            // Plan background
            const elements = [
              <g key={`plan-${planIndex}`}>
                {/* Plan container */}
                <rect
                  x={planX}
                  y={centerY - 60}
                  width={planWidth}
                  height={120}
                  rx={12}
                  fill={phaseColor}
                  fillOpacity={0.06}
                  stroke={phaseColor}
                  strokeOpacity={0.2}
                  strokeWidth={1}
                />
                {/* Plan label */}
                <text
                  x={planX + planWidth / 2}
                  y={centerY - 68}
                  textAnchor="middle"
                  fill={phaseColor}
                  fontSize={10}
                  fontWeight={500}
                  opacity={0.8}
                >
                  {plan.name.length > 35 ? `${plan.name.slice(0, 35)}...` : plan.name}
                </text>

                {/* Task nodes */}
                {plan.tasks.map((task, taskIndex) => {
                  const cx = planX + planPadding + taskIndex * taskSpacing + nodeRadius;
                  const cy = centerY;
                  const statusColor = STATUS_COLORS[task.status] ?? '#8a8078';
                  const icon = getTaskIcon(task.name);
                  const isFailed = task.status === 'failed';

                  return (
                    <g key={`task-${planIndex}-${taskIndex}`}>
                      {/* Connector to next task */}
                      {taskIndex < plan.tasks.length - 1 && (
                        <line
                          x1={cx + nodeRadius + 2}
                          y1={cy}
                          x2={cx + taskSpacing - nodeRadius - 2}
                          y2={cy}
                          stroke={statusColor}
                          strokeWidth={2}
                          strokeOpacity={0.4}
                          strokeDasharray={isFailed ? '4 4' : undefined}
                        />
                      )}
                      {/* Node circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={nodeRadius}
                        fill="var(--card)"
                        stroke={statusColor}
                        strokeWidth={isFailed ? 2.5 : 2}
                      />
                      {/* Icon */}
                      <text
                        x={cx}
                        y={cy + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={14}
                      >
                        {icon}
                      </text>
                      {/* Task label below */}
                      <text
                        x={cx}
                        y={cy + nodeRadius + 14}
                        textAnchor="middle"
                        fill="var(--foreground)"
                        fontSize={8}
                        opacity={0.6}
                      >
                        {task.name.length > 20 ? `${task.name.slice(0, 18)}..` : task.name}
                      </text>
                      {/* Event count above */}
                      <text
                        x={cx}
                        y={cy - nodeRadius - 6}
                        textAnchor="middle"
                        fill="var(--muted)"
                        fontSize={8}
                      >
                        {task.eventIds.length}e
                      </text>
                    </g>
                  );
                })}
              </g>,
            ];

            // Connector between plans
            if (planIndex < plans.length - 1) {
              const fromX = planX + planWidth;
              const toX = planX + planWidth + planGap;
              elements.push(
                <line
                  key={`plan-connector-${planIndex}`}
                  x1={fromX}
                  y1={centerY}
                  x2={toX}
                  y2={centerY}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  strokeDasharray="6 4"
                />
              );
            }

            offsetX += planWidth + planGap;
            return elements;
          })}
        </svg>
      </div>
    </div>
  );
}
