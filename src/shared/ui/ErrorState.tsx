import clsx from 'clsx';

type ErrorStateProps = {
  message: string;
  className?: string;
};

export function ErrorState({ message, className }: ErrorStateProps) {
  return (
    <div className={clsx('border border-ember/30 bg-ember/5 rounded-lg p-4', className)}>
      <p className="text-sm text-ember">{message}</p>
    </div>
  );
}
