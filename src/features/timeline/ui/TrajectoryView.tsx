'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { EmptyState } from '@/shared/ui/EmptyState';
import type { TimelinePlan } from '@/entities/analysis/model';
import { LatentDivergence } from '@/shared/ui/LatentDivergence';
import { PlanCard } from '@/features/timeline/ui/PlanCard';

type TrajectoryViewProps = {
  plans: TimelinePlan[];
  sessionId?: string;
  level?: number;
  className?: string;
};

type Orientation = 'horizontal' | 'vertical';

const PHASE_STYLE: Record<string, string> = {
  research: 'italic',
  implementation: 'font-bold',
  scaffolding: 'uppercase',
  testing: 'underline',
  debugging: 'line-through',
  refinement: 'font-[300]',
  other: '',
};

/* Connector SVG between plans */
function PlanConnector() {
  return (
    <div className="flex justify-center py-0.5">
      <svg width="6" height="24" className="overflow-visible">
        <line
          x1="3" y1="0" x2="3" y2="24"
          stroke="var(--color-ember)"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeOpacity="0.35"
          style={{ animation: 'current-flow 1s linear infinite' }}
        />
      </svg>
    </div>
  );
}

export function TrajectoryView({ plans, sessionId, level = 0, className }: TrajectoryViewProps) {
  const [orientation, setOrientation] = useState<Orientation>('vertical');

  if (plans.length === 0) {
    return <EmptyState message="No trajectory data." className={className} />;
  }

  const allTasks = plans.flatMap((p) => p.tasks);
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const failedTasks = allTasks.filter((t) => t.status === 'failed').length;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Stats + orientation toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="text-text-secondary">{'\u2713'}</span>
            <span>{completedTasks} completed</span>
          </div>
          {failedTasks > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-primary">{'\u2717'}</span>
              <span>{failedTasks} failed</span>
            </div>
          )}
          <span>{plans.length} plans &middot; {allTasks.length} tasks</span>

          {/* Phase legend — typographic styles instead of colored dots */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            {Object.entries(PHASE_STYLE).map(([phase, style]) => {
              if (!plans.some((p) => p.phase === phase)) return null;
              return (
                <div key={phase} className="flex items-center gap-1">
                  <span className={clsx('text-[10px] font-mono text-text-secondary', style)}>{phase}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orientation toggle */}
        <div className="flex items-center border border-border bg-depth-1 rounded-md">
          <button
            type="button"
            onClick={() => setOrientation('horizontal')}
            className={clsx(
              'px-2.5 py-1 text-xs font-mono transition-colors duration-300 rounded-l-md',
              orientation === 'horizontal'
                ? 'bg-ember/10 text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
            title="Horizontal layout"
          >
            {'\u2194'}
          </button>
          <button
            type="button"
            onClick={() => setOrientation('vertical')}
            className={clsx(
              'px-2.5 py-1 text-xs font-mono transition-colors duration-300 border-l border-border rounded-r-md',
              orientation === 'vertical'
                ? 'bg-ember/10 text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
            title="Vertical layout"
          >
            {'\u2195'}
          </button>
        </div>
      </div>

      {/* Plan cards with art background */}
      <div className="relative">
        {/* Latent Divergence behind trajectory — fixed height, repeats via CSS */}
        <div className="absolute inset-x-0 top-0 -z-10 opacity-10 pointer-events-none h-[600px]">
          <LatentDivergence variant="hero" agentCount={120} height={600} />
        </div>

        <div
          className={clsx(
            'relative flex gap-4',
            orientation === 'vertical' ? 'flex-col' : 'flex-row items-start overflow-x-auto',
          )}
        >
          {plans.map((plan, i) => (
            <div key={`plan-${i}`} className={clsx(orientation === 'horizontal' && 'flex-shrink-0 min-w-[300px]')}>
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
    </div>
  );
}
