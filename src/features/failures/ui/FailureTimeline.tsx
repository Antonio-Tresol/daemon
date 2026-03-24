'use client';

import { cn } from '@/shared/lib/cn';
import { FailureCard } from '@/features/failures/ui/FailureCard';
import { useFailures } from '@/features/failures/model/use-failures';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';

type FailureTimelineProps = {
  sessionId?: string;
  className?: string;
};

export function FailureTimeline({ sessionId, className }: FailureTimelineProps) {
  const { failures, analysis, isLoading, error } = useFailures(sessionId);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <span className="text-sm text-muted">Loading failures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-xl border border-status-red/30 bg-status-red/5 p-4', className)}>
        <p className="text-sm text-status-red">Failed to load failures: {error}</p>
      </div>
    );
  }

  if (failures.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <p className="text-sm text-muted">No failures detected.</p>
        <p className="mt-1 text-xs text-muted">
          Failures are identified when analysis runs on session events.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {analysis && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Analysis status:</span>
          <AnalysisBadge status={analysis.status} />
          <span className="ml-2">{failures.length} failure{failures.length !== 1 ? 's' : ''} found</span>
        </div>
      )}

      <div className="space-y-3">
        {failures.map((failure, i) => (
          <FailureCard key={`${failure.timestamp}-${i}`} failure={failure} />
        ))}
      </div>
    </div>
  );
}
