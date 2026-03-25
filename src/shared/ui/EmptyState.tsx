import clsx from 'clsx';

type EmptyStateProps = {
  message: string;
  icon?: string;
  detail?: string;
  className?: string;
};

export function EmptyState({ message, icon, detail, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && <span className="text-2xl text-text-secondary mb-2">{icon}</span>}
      <p className="text-sm text-text-muted">{message}</p>
      {detail && <p className="mt-1 text-xs text-text-muted">{detail}</p>}
    </div>
  );
}
