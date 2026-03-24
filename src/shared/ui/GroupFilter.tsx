'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';

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
        // silently fail
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
      className={cn(
        'rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground outline-none',
        'focus:border-accent transition-colors',
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
