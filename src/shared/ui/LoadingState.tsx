import clsx from 'clsx';

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={clsx('flex items-center justify-center py-12', className)}>
      <span className="text-sm font-mono text-text-muted">{message}</span>
    </div>
  );
}
