'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';
import { useTimeline } from '@/features/timeline/model/use-timeline';
import { PlanGroup } from '@/features/timeline/ui/PlanGroup';
import { TrajectoryView } from '@/features/timeline/ui/TrajectoryView';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';

type ViewMode = 'list' | 'trajectory';

const MATRYOSHKA_LEVELS = [
  { label: 'Events', icon: '\u25C9', description: 'Raw events grouped into plans and tasks' },
  { label: 'Phases', icon: '\u25CE', description: 'Plans grouped into phases and milestones' },
  { label: 'Narrative', icon: '\u25CB', description: 'Session narrative — the big picture' },
] as const;

type TimelineViewProps = {
  sessionId?: string;
  level?: number;
  className?: string;
};

export function TimelineView({ sessionId, level: externalLevel, className }: TimelineViewProps) {
  const { plans, analysis, isLoading, error, level, setLevel, refetch } = useTimeline(
    sessionId,
    externalLevel,
  );
  const [viewMode, setViewMode] = useState<ViewMode>('trajectory');
  const [isBuildingLevel, setIsBuildingLevel] = useState(false);

  const handleBuildLevel = async (targetLevel: number) => {
    if (!sessionId || isBuildingLevel) return;
    setIsBuildingLevel(true);
    try {
      await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type: 'timeline', level: targetLevel }),
      });
      setLevel(targetLevel);
    } catch {
      // handled by refetch
    } finally {
      setIsBuildingLevel(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading timeline..." className={className} />;
  }

  if (error) {
    return (
      <ErrorState message={`\u2717 Failed to load timeline: ${error}`} className={className} />
    );
  }

  if (plans.length === 0 && level === 0) {
    return (
      <EmptyState
        message="No timeline data available yet."
        detail="Analysis runs automatically when events are captured."
        className={className}
      />
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Controls bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Matryoshka level selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-mono hidden sm:inline">
              Depth
            </span>
            <div className="flex items-center border border-border bg-depth-1 rounded-md">
              {MATRYOSHKA_LEVELS.map((lvl, i) => (
                <button
                  key={lvl.label}
                  type="button"
                  onClick={() => setLevel(i)}
                  title={lvl.description}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-mono transition-colors duration-300 flex items-center gap-1.5',
                    i > 0 && 'border-l border-border',
                    i === 0 && 'rounded-l-md',
                    i === MATRYOSHKA_LEVELS.length - 1 && 'rounded-r-md',
                    level === i
                      ? 'bg-ember/10 text-ember font-medium'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  <span className="text-sm leading-none">{lvl.icon}</span>
                  <span>{lvl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Build level button — show when no data at current level */}
          {plans.length === 0 && level > 0 && (
            <button
              type="button"
              onClick={() => handleBuildLevel(level)}
              disabled={isBuildingLevel}
              className="border border-ember/40 bg-transparent px-3 py-1.5 text-xs font-mono font-medium text-ember hover:bg-ember/10 transition-colors duration-300 disabled:opacity-50 rounded-md"
            >
              {isBuildingLevel ? 'Nesting...' : `Open ${MATRYOSHKA_LEVELS[level].label}`}
            </button>
          )}

          {analysis && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <AnalysisBadge status={analysis.status} />
            </div>
          )}
        </div>

        {/* View mode switcher */}
        <div className="flex items-center border border-border bg-depth-1 rounded-md">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={clsx(
              'px-3 py-1.5 text-xs font-mono transition-colors duration-300 rounded-l-md',
              viewMode === 'list'
                ? 'bg-ember/10 text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('trajectory')}
            className={clsx(
              'px-3 py-1.5 text-xs font-mono transition-colors duration-300 border-l border-border rounded-r-md',
              viewMode === 'trajectory'
                ? 'bg-ember/10 text-ember font-medium'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            Trajectory
          </button>
        </div>
      </div>

      {/* Empty state for higher levels */}
      {plans.length === 0 && level > 0 && !isBuildingLevel && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-3 text-text-muted">{MATRYOSHKA_LEVELS[level].icon}</span>
          <p className="text-sm text-text-secondary">
            This depth level hasn&apos;t been charted yet.
          </p>
          <p className="mt-1 text-xs text-text-muted">{MATRYOSHKA_LEVELS[level].description}</p>
        </div>
      )}

      {/* View content */}
      {plans.length > 0 && viewMode === 'list' && (
        <div className="relative space-y-3">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-ember/20" />
          {plans.map((plan, i) => (
            <div key={`${plan.name}-${i}`} className="relative pl-12">
              <div className="absolute left-4 top-5 h-3 w-3 rounded-sm border-2 border-ember bg-depth-0" />
              <PlanGroup plan={plan} sessionId={sessionId} />
            </div>
          ))}
        </div>
      )}

      {plans.length > 0 && viewMode === 'trajectory' && (
        <TrajectoryView plans={plans} sessionId={sessionId} level={level} />
      )}
    </div>
  );
}
