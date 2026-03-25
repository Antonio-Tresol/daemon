'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { Failure } from '@/entities/analysis/model';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';
import { useFailures } from '@/features/failures/model/use-failures';
import { formatTimestamp } from '@/shared/lib/format';
import { impactSymbol } from '@/shared/lib/severity-symbols';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';

type FailureTimelineProps = {
  sessionId?: string;
  className?: string;
};

/* Monochrome icons for failure types */
function FailureTypeIcon({ type, className }: { type: Failure['type']; className?: string }) {
  const cls = clsx('h-4 w-4', className);
  switch (type) {
    case 'tool_failure':
      return (
        <svg
          className={cls}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <title>Tool</title>
          <path d="M10 2l-1 4 4-1 1-3zM6 14l1-4-4 1-1 3z" />
          <path d="M5 5l6 6" />
        </svg>
      );
    case 'api_error':
      return (
        <svg
          className={cls}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <title>API</title>
          <rect x="2" y="4" width="12" height="8" rx="1.5" />
          <path d="M5 7v2M8 7v2M11 7v2" />
        </svg>
      );
    case 'permission_denied':
      return (
        <svg
          className={cls}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <title>Permission</title>
          <rect x="4" y="7" width="8" height="6" rx="1" />
          <path d="M6 7V5a2 2 0 014 0v2" />
          <circle cx="8" cy="10.5" r="0.5" fill="currentColor" />
        </svg>
      );
    case 'logic_error':
      return (
        <svg
          className={cls}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <title>Logic</title>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v4M8 11v.5" />
        </svg>
      );
    case 'timeout':
      return (
        <svg
          className={cls}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <title>Timeout</title>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v3h3" />
        </svg>
      );
    default:
      return (
        <svg
          className={cls}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <title>Error</title>
          <path d="M8 2l6 12H2z" />
          <path d="M8 7v3M8 12v.5" />
        </svg>
      );
  }
}

function CompactFailureCard({ failure, isLast }: { failure: Failure; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <span className="text-ember text-xs mt-1 shrink-0 leading-none">{'\u25CF'}</span>
        {!isLast && <div className="w-px flex-1 bg-border/50 mt-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 mb-4 border border-border bg-depth-1 rounded-lg border-l-2 overflow-hidden border-l-ember">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 text-left hover:bg-depth-2/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FailureTypeIcon type={failure.type} className="text-text-muted shrink-0" />
            <span className="text-xs font-medium text-text-primary flex-1 line-clamp-1">
              {failure.description}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md font-mono text-[10px] uppercase tracking-wider bg-depth-2 text-text-secondary px-1.5 py-0.5">
              <span className="text-ember">{impactSymbol(failure.impact)}</span>
              {failure.impact}
            </span>
            <span className="text-[10px] text-text-muted font-mono shrink-0">
              {formatTimestamp(failure.timestamp)}
            </span>
            <span className="text-xs text-text-muted">{expanded ? '\u25BC' : '\u25B6'}</span>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border/50 px-3 pb-3 space-y-2 depth-reveal">
            <p className="text-xs text-text-primary/80 pt-2">{failure.description}</p>
            <div className="bg-depth-2 rounded-md p-2.5">
              <p className="text-[9px] font-mono font-medium uppercase tracking-wider text-text-muted mb-0.5">
                Root Cause
              </p>
              <p className="text-xs text-text-primary/70">{failure.rootCause}</p>
            </div>
            {(failure.evidence?.length > 0 || failure.eventId) && (
              <div>
                <p className="text-[9px] font-mono font-medium uppercase tracking-wider text-text-muted mb-1">
                  Evidence
                </p>
                <div className="flex flex-wrap gap-1">
                  {(failure.evidence ?? (failure.eventId ? [failure.eventId] : [])).map(
                    (eid, i) => (
                      <span
                        key={`${eid}-${i}`}
                        className="text-[10px] font-mono text-ember bg-ember/10 px-1.5 py-0.5 rounded-sm"
                      >
                        {eid.slice(0, 12)}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FailureTimeline({ sessionId, className }: FailureTimelineProps) {
  const { failures, analysis, isLoading, error } = useFailures(sessionId);
  const [filterImpact, setFilterImpact] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingState message="Loading failures..." className={className} />;
  }

  if (error) {
    return <ErrorState message={`Failed to load: ${error}`} className={className} />;
  }

  if (failures.length === 0) {
    return <EmptyState message="No failures detected" icon={'\u2713'} className={className} />;
  }

  const criticalCount = failures.filter((f) => f.impact === 'critical').length;
  const warningCount = failures.filter((f) => f.impact === 'warning').length;
  const infoCount = failures.filter((f) => f.impact === 'info').length;

  const filtered = filterImpact ? failures.filter((f) => f.impact === filterImpact) : failures;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Summary bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {analysis && <AnalysisBadge status={analysis.status} />}

        <button
          type="button"
          onClick={() => setFilterImpact(filterImpact === null ? null : null)}
          className={clsx(
            'font-mono text-xs px-2 py-1 rounded-md transition-colors',
            filterImpact === null
              ? 'bg-ember/15 text-ember'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          All ({failures.length})
        </button>

        {criticalCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterImpact(filterImpact === 'critical' ? null : 'critical')}
            className={clsx(
              'flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded-md transition-colors',
              filterImpact === 'critical'
                ? 'bg-ember/15 text-ember'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="text-ember">{'\u2717\u2717'}</span>
            {criticalCount} critical
          </button>
        )}

        {warningCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterImpact(filterImpact === 'warning' ? null : 'warning')}
            className={clsx(
              'flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded-md transition-colors',
              filterImpact === 'warning'
                ? 'bg-ember/15 text-ember'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="text-ember">{'\u25C6'}</span>
            {warningCount} warning
          </button>
        )}

        {infoCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterImpact(filterImpact === 'info' ? null : 'info')}
            className={clsx(
              'flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded-md transition-colors',
              filterImpact === 'info'
                ? 'bg-ember/15 text-ember'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="text-ember">{'\u25CB'}</span>
            {infoCount} info
          </button>
        )}
      </div>

      {/* Timeline view */}
      <div className="pl-1">
        {filtered.map((failure, i) => (
          <CompactFailureCard
            key={`${failure.timestamp}-${i}`}
            failure={failure}
            isLast={i === filtered.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
