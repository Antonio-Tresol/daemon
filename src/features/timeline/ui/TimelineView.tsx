'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { PlanGroup } from '@/features/timeline/ui/PlanGroup';
import { TrajectoryView } from '@/features/timeline/ui/TrajectoryView';
import { useTimeline } from '@/features/timeline/model/use-timeline';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';

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
  const { plans, analysis, isLoading, error, level, setLevel, refetch } = useTimeline(sessionId, externalLevel);
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
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <span className="text-sm text-muted">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-xl border border-status-red/30 bg-status-red/5 p-4', className)}>
        <p className="text-sm text-status-red">Failed to load timeline: {error}</p>
      </div>
    );
  }

  if (plans.length === 0 && level === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <p className="text-sm text-muted">No timeline data available yet.</p>
        <p className="mt-1 text-xs text-muted">Analysis runs automatically when events are captured.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Matryoshka level selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted font-medium hidden sm:inline">Matryoshka</span>
            <div className="flex items-center rounded-lg border border-card-border bg-card">
              {MATRYOSHKA_LEVELS.map((lvl, i) => (
                <button
                  key={lvl.label}
                  type="button"
                  onClick={() => setLevel(i)}
                  title={lvl.description}
                  className={cn(
                    'px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5',
                    i === 0 && 'rounded-l-lg',
                    i === MATRYOSHKA_LEVELS.length - 1 && 'rounded-r-lg',
                    i > 0 && 'border-l border-card-border',
                    level === i
                      ? 'bg-accent/15 text-accent font-medium'
                      : 'text-muted hover:text-foreground',
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
              className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {isBuildingLevel ? 'Nesting...' : `Open ${MATRYOSHKA_LEVELS[level].label}`}
            </button>
          )}

          {analysis && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <AnalysisBadge status={analysis.status} />
            </div>
          )}
        </div>

        {/* View mode switcher */}
        <div className="flex items-center rounded-lg border border-card-border bg-card">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 text-xs transition-colors rounded-l-lg',
              viewMode === 'list'
                ? 'bg-accent/15 text-accent font-medium'
                : 'text-muted hover:text-foreground',
            )}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('trajectory')}
            className={cn(
              'px-3 py-1.5 text-xs transition-colors rounded-r-lg border-l border-card-border',
              viewMode === 'trajectory'
                ? 'bg-accent/15 text-accent font-medium'
                : 'text-muted hover:text-foreground',
            )}
          >
            Trajectory
          </button>
        </div>
      </div>

      {/* Empty state for higher levels */}
      {plans.length === 0 && level > 0 && !isBuildingLevel && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-3">{MATRYOSHKA_LEVELS[level].icon}</span>
          <p className="text-sm text-muted">This Matryoshka level hasn&apos;t been opened yet.</p>
          <p className="mt-1 text-xs text-muted">
            {MATRYOSHKA_LEVELS[level].description}
          </p>
        </div>
      )}

      {/* View content */}
      {plans.length > 0 && viewMode === 'list' && (
        <div className="relative space-y-3">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-accent/20" />
          {plans.map((plan, i) => (
            <div key={`${plan.name}-${i}`} className="relative pl-12">
              <div className="absolute left-4 top-5 h-3 w-3 rounded-full border-2 border-accent bg-card" />
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
