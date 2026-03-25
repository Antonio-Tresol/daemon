import clsx from 'clsx';

type TaskIconProps = {
  taskName: string;
  className?: string;
};

/* Monochrome SVG icons that adapt to currentColor */
export function TaskIcon({ taskName, className }: TaskIconProps) {
  const cls = clsx('h-4 w-4', className);
  const lower = taskName.toLowerCase();

  if (
    lower.includes('read') ||
    lower.includes('inspect') ||
    lower.includes('search') ||
    lower.includes('explore')
  ) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Search</title>
        <circle cx="7" cy="7" r="4" />
        <path d="M10 10l4 4" />
      </svg>
    );
  }
  if (
    lower.includes('edit') ||
    lower.includes('write') ||
    lower.includes('update') ||
    lower.includes('replace') ||
    lower.includes('refine') ||
    lower.includes('polish')
  ) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Edit</title>
        <path d="M11 2l3 3-8 8H3v-3z" />
        <path d="M9 4l3 3" />
      </svg>
    );
  }
  if (
    lower.includes('test') ||
    lower.includes('verify') ||
    lower.includes('check') ||
    lower.includes('health') ||
    lower.includes('integration')
  ) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Check</title>
        <path d="M3 8l3 3 7-7" />
      </svg>
    );
  }
  if (
    lower.includes('bash') ||
    lower.includes('run') ||
    lower.includes('npm') ||
    lower.includes('build') ||
    lower.includes('trigger') ||
    lower.includes('set up')
  ) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Run</title>
        <rect x="1" y="2" width="14" height="12" rx="2" />
        <path d="M4 6l3 2-3 2" />
        <path d="M9 10h3" />
      </svg>
    );
  }
  if (lower.includes('fix') || lower.includes('debug') || lower.includes('diagnose')) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Fix</title>
        <path d="M10 2l-1 4 4-1 1-3zM6 14l1-4-4 1-1 3z" />
        <path d="M5 5l6 6" />
      </svg>
    );
  }
  if (
    lower.includes('create') ||
    lower.includes('scaffold') ||
    lower.includes('install') ||
    lower.includes('plan')
  ) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Create</title>
        <path d="M8 3v10M3 8h10" />
      </svg>
    );
  }
  if (
    lower.includes('navigate') ||
    lower.includes('screenshot') ||
    lower.includes('preview') ||
    lower.includes('visually')
  ) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Preview</title>
        <circle cx="8" cy="7" r="3" />
        <path d="M1 7s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
      </svg>
    );
  }
  if (lower.includes('implement') || lower.includes('major') || lower.includes('feature')) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Implement</title>
        <path d="M4 2v12l4-3 4 3V2z" />
      </svg>
    );
  }
  if (lower.includes('agent') || lower.includes('delegate') || lower.includes('team')) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Agent</title>
        <circle cx="6" cy="5" r="2.5" />
        <circle cx="11" cy="5" r="2" />
        <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
      </svg>
    );
  }
  if (lower.includes('investigate') || lower.includes('remaining') || lower.includes('issue')) {
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Investigate</title>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3M8 11v.5" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <title>Task</title>
      <circle cx="8" cy="8" r="5" />
      <path d="M8 5v3h3" />
    </svg>
  );
}
