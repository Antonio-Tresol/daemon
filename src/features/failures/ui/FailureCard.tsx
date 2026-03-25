import clsx from 'clsx';
import type { Failure } from '@/entities/analysis/model';
import { formatTimestamp } from '@/shared/lib/format';
import { impactSymbol } from '@/shared/lib/severity-symbols';
import { Badge } from '@/shared/ui/Badge';

type FailureCardProps = {
  failure: Failure;
  className?: string;
};

function typeLabel(type: Failure['type']): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FailureCard({ failure, className }: FailureCardProps) {
  return (
    <div
      className={clsx(
        'border border-border bg-depth-1 rounded-lg p-4 border-l-2',
        'border-l-ember',
        className,
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-md font-mono text-[10px] uppercase tracking-wider bg-depth-2 text-text-secondary px-1.5 py-0.5">
          <span className="text-ember">{impactSymbol(failure.impact)}</span>
          {failure.impact}
        </span>
        <Badge variant="neutral" size="sm">
          {typeLabel(failure.type)}
        </Badge>
        <span className="ml-auto text-[10px] text-text-muted font-mono">
          {formatTimestamp(failure.timestamp)}
        </span>
      </div>

      <p className="mt-2.5 text-sm text-text-primary">{failure.description}</p>

      <div className="mt-3 bg-depth-2 rounded-md p-3">
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
