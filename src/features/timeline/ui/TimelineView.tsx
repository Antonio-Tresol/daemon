'use client';

import { cn } from '@/shared/lib/cn';
import { PlanGroup } from '@/features/timeline/ui/PlanGroup';
import { useTimeline } from '@/features/timeline/model/use-timeline';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';

type TimelineViewProps = {
  sessionId?: string;
  className?: string;
};

export function TimelineView({ sessionId, className }: TimelineViewProps) {
  const { plans, analysis, isLoading, error } = useTimeline(sessionId);

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

  if (plans.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <p className="text-sm text-muted">No timeline data available yet.</p>
        <p className="mt-1 text-xs text-muted">Analysis runs automatically when events are captured.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {analysis && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Analysis status:</span>
          <AnalysisBadge status={analysis.status} />
        </div>
      )}

      {/* Vertical timeline connector */}
      <div className="relative space-y-3">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-accent/20" />
        {plans.map((plan, i) => (
          <div key={`${plan.name}-${i}`} className="relative pl-12">
            <div className="absolute left-4 top-5 h-3 w-3 rounded-full border-2 border-accent bg-card" />
            <PlanGroup plan={plan} />
          </div>
        ))}
      </div>
    </div>
  );
}
