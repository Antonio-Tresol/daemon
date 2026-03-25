import clsx from 'clsx';

type Status = 'active' | 'completed' | 'error' | 'pending';

type StatusIndicatorProps = {
  status: Status;
  className?: string;
};

const statusConfig: Record<Status, { symbol: string; style: string }> = {
  active: { symbol: '●', style: 'text-ember pulse-signal' },
  completed: { symbol: '✓', style: 'text-text-secondary' },
  error: { symbol: '✗', style: 'text-text-primary' },
  pending: { symbol: '◌', style: 'text-text-muted' },
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const { symbol, style } = statusConfig[status];

  return <span className={clsx('inline-flex font-mono text-xs', style, className)}>{symbol}</span>;
}
