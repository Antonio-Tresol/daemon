'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { formatTimestamp } from '@/shared/lib/format';
import { useFailures } from '@/features/failures/model/use-failures';
import { AnalysisBadge } from '@/entities/analysis/ui/AnalysisBadge';
import type { Failure } from '@/entities/analysis/model';

type FailureTimelineProps = {
  sessionId?: string;
  className?: string;
};

/* Monochrome icons for failure types */
function FailureTypeIcon({ type, className }: { type: Failure['type']; className?: string }) {
  const cls = cn('h-4 w-4', className);
  switch (type) {
    case 'tool_failure':
      return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Tool</title><path d="M10 2l-1 4 4-1 1-3zM6 14l1-4-4 1-1 3z" /><path d="M5 5l6 6" /></svg>);
    case 'api_error':
      return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>API</title><rect x="2" y="4" width="12" height="8" rx="1.5" /><path d="M5 7v2M8 7v2M11 7v2" /></svg>);
    case 'permission_denied':
      return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Permission</title><rect x="4" y="7" width="8" height="6" rx="1" /><path d="M6 7V5a2 2 0 014 0v2" /><circle cx="8" cy="10.5" r="0.5" fill="currentColor" /></svg>);
    case 'logic_error':
      return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Logic</title><circle cx="8" cy="8" r="6" /><path d="M8 5v4M8 11v.5" /></svg>);
    case 'timeout':
      return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Timeout</title><circle cx="8" cy="8" r="6" /><path d="M8 5v3h3" /></svg>);
    default:
      return (<svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Error</title><path d="M8 2l6 12H2z" /><path d="M8 7v3M8 12v.5" /></svg>);
  }
}

const IMPACT_STYLES: Record<string, { border: string; bg: string; dot: string }> = {
  critical: { border: 'border-l-signal-red', bg: 'bg-signal-red/5', dot: 'bg-signal-red' },
  warning: { border: 'border-l-signal-amber', bg: 'bg-signal-amber/5', dot: 'bg-signal-amber' },
  info: { border: 'border-l-signal-blue', bg: 'bg-signal-blue/5', dot: 'bg-signal-blue' },
};

function CompactFailureCard({ failure, isLast }: { failure: Failure; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const styles = IMPACT_STYLES[failure.impact] ?? IMPACT_STYLES.info;

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={cn('h-3 w-3 shrink-0 mt-1', styles.dot)} />
        {!isLast && <div className="w-px flex-1 bg-border/50 mt-1" />}
      </div>

      {/* Card */}
      <div className={cn('flex-1 mb-4 border border-border bg-depth-1 fracture-bg border-l-2 overflow-hidden', styles.border)}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 text-left hover:bg-depth-2/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FailureTypeIcon type={failure.type} className="text-muted shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1 line-clamp-1">
              {failure.description}
            </span>
            <Badge variant={failure.impact === 'critical' ? 'error' : failure.impact === 'warning' ? 'warning' : 'info'} size="sm">
              {failure.impact}
            </Badge>
            <span className="text-[10px] text-muted shrink-0">
              {formatTimestamp(failure.timestamp)}
            </span>
            <span className="text-xs text-muted">{expanded ? '\u25BC' : '\u25B6'}</span>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border/50 px-3 pb-3 space-y-2 depth-reveal">
            <p className="text-xs text-text-primary/80 pt-2">{failure.description}</p>
            <div className="bg-depth-2 p-2.5">
              <p className="text-[9px] font-mono font-medium uppercase tracking-wider text-text-muted mb-0.5">Root Cause</p>
              <p className="text-xs text-text-primary/70">{failure.rootCause}</p>
            </div>
            {failure.eventId && (
              <p className="text-[10px] text-text-muted font-mono">
                Evidence: {failure.eventId.slice(0, 16)}
              </p>
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
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <span className="text-sm text-muted">Loading failures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('border border-signal-red/30 bg-signal-red/5 p-4', className)}>
        <p className="text-sm text-signal-red">Failed to load: {error}</p>
      </div>
    );
  }

  if (failures.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <svg className="h-8 w-8 text-status-green mb-2" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><title>Clean</title><circle cx="8" cy="8" r="6" /><path d="M5 8l2 2 4-4" /></svg>
        <p className="text-sm text-muted">No failures detected</p>
      </div>
    );
  }

  const criticalCount = failures.filter((f) => f.impact === 'critical').length;
  const warningCount = failures.filter((f) => f.impact === 'warning').length;
  const infoCount = failures.filter((f) => f.impact === 'info').length;

  const filtered = filterImpact
    ? failures.filter((f) => f.impact === filterImpact)
    : failures;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {analysis && <AnalysisBadge status={analysis.status} />}

        <button
          type="button"
          onClick={() => setFilterImpact(filterImpact === null ? null : null)}
          className={cn(
            'font-mono text-xs px-2 py-1 transition-colors',
            filterImpact === null ? 'bg-border/50 text-text-primary' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          All ({failures.length})
        </button>

        {criticalCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterImpact(filterImpact === 'critical' ? null : 'critical')}
            className={cn(
              'flex items-center gap-1.5 font-mono text-xs px-2 py-1 transition-colors',
              filterImpact === 'critical' ? 'bg-signal-red/15 text-signal-red' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="inline-block h-2 w-2 bg-signal-red" />
            {criticalCount} critical
          </button>
        )}

        {warningCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterImpact(filterImpact === 'warning' ? null : 'warning')}
            className={cn(
              'flex items-center gap-1.5 font-mono text-xs px-2 py-1 transition-colors',
              filterImpact === 'warning' ? 'bg-signal-amber/15 text-signal-amber' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="inline-block h-2 w-2 bg-signal-amber" />
            {warningCount} warning
          </button>
        )}

        {infoCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterImpact(filterImpact === 'info' ? null : 'info')}
            className={cn(
              'flex items-center gap-1.5 font-mono text-xs px-2 py-1 transition-colors',
              filterImpact === 'info' ? 'bg-signal-blue/15 text-signal-blue' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span className="inline-block h-2 w-2 bg-signal-blue" />
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
