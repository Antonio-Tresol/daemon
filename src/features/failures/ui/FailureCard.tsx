import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { formatTimestamp } from '@/shared/lib/format';
import type { Failure } from '@/entities/analysis/model';

type FailureCardProps = {
  failure: Failure;
  className?: string;
};

function impactVariant(impact: Failure['impact']) {
  switch (impact) {
    case 'critical': return 'error' as const;
    case 'warning': return 'warning' as const;
    case 'info': return 'info' as const;
  }
}

function impactBorderColor(impact: Failure['impact']): string {
  switch (impact) {
    case 'critical': return 'border-l-signal-red';
    case 'warning': return 'border-l-signal-amber';
    case 'info': return 'border-l-signal-blue';
  }
}

function typeLabel(type: Failure['type']): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FailureCard({ failure, className }: FailureCardProps) {
  return (
    <div
      className={cn(
        'border border-border bg-depth-1 fracture-bg p-4 border-l-2',
        impactBorderColor(failure.impact),
        className,
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={impactVariant(failure.impact)} size="sm">
          {failure.impact}
        </Badge>
        <Badge variant="neutral" size="sm">{typeLabel(failure.type)}</Badge>
        <span className="ml-auto text-[10px] text-text-muted font-mono">
          {formatTimestamp(failure.timestamp)}
        </span>
      </div>

      <p className="mt-2.5 text-sm text-text-primary">{failure.description}</p>

      <div className="mt-3 bg-depth-2 p-3">
        <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted mb-1">
          Root Cause
        </p>
        <p className="text-xs text-text-primary/80">{failure.rootCause}</p>
      </div>

      {failure.eventId && (
        <div className="mt-2 text-[10px] text-text-muted font-mono">
          Event: {failure.eventId.slice(0, 12)}
        </div>
      )}
    </div>
  );
}
