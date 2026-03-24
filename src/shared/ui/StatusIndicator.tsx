import { cn } from '@/shared/lib/cn';

type Status = 'active' | 'completed' | 'error' | 'pending';

type StatusIndicatorProps = {
  status: Status;
  className?: string;
};

const statusStyles: Record<Status, string> = {
  active: 'bg-signal-green pulse-active',
  completed: 'bg-sediment',
  error: 'bg-signal-red pulse-error',
  pending: 'bg-text-muted',
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex h-2 w-2 rounded-full',
        statusStyles[status],
        className,
      )}
    />
  );
}
