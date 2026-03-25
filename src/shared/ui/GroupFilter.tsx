'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

type GroupFilterProps = {
  value: string | null;
  onChange: (group: string | null) => void;
  className?: string;
};

export function GroupFilter({ value, onChange, className }: GroupFilterProps) {
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/groups')
      .then((res) => res.json())
      .then((data: { groups: string[] }) => {
        setGroups(data.groups ?? []);
      })
      .catch(() => {
        // Non-critical UI filter — groups list is optional, safe to degrade without it
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || groups.length === 0) {
    return null;
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={clsx(
        'rounded-md border border-border bg-depth-1 px-3 py-2 font-mono text-sm text-text-primary outline-none',
        'focus:border-ember/50 transition-colors',
        className,
      )}
    >
      <option value="">All Sessions</option>
      {groups.map((group) => (
        <option key={group} value={group}>
          {group}
        </option>
      ))}
    </select>
  );
}
