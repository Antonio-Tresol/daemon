const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 0) return 'just now';
  if (diff < MINUTE) return `${Math.floor(diff / SECOND)}s ago`;
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDuration(ms: number): string {
  if (ms < SECOND) return `${Math.round(ms)}ms`;
  if (ms < MINUTE) return `${(ms / SECOND).toFixed(1)}s`;
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m ${Math.floor((ms % MINUTE) / SECOND)}s`;
  return `${Math.floor(ms / HOUR)}h ${Math.floor((ms % HOUR) / MINUTE)}m`;
}

export function formatCost(usd: number): string {
  if (usd === 0) return '$0.00';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}
