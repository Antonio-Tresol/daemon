import { cn } from '@/shared/lib/cn';

type Status = 'active' | 'completed' | 'error' | 'pending';

type StatusIndicatorProps = {
  status: Status;
  className?: string;
};

const statusColors: Record<Status, string> = {
  active: 'bg-status-green',
  completed: 'bg-muted',
  error: 'bg-status-red',
  pending: 'bg-status-amber',
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5', className)}>
      {status === 'active' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            statusColors[status],
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex h-2.5 w-2.5 rounded-full',
          statusColors[status],
        )}
      />
    </span>
  );
}
