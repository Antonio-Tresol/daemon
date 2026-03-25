'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import type { Session, SessionStatus } from '@/entities/session/model';
import { formatCost, formatTimestamp } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';

type SessionCardProps = {
  session: Session;
  className?: string;
};

function statusToIndicator(status: SessionStatus) {
  switch (status) {
    case 'active':
      return 'active' as const;
    case 'completed':
      return 'completed' as const;
    case 'error':
      return 'error' as const;
  }
}

function statusVariant(status: SessionStatus) {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'completed':
      return 'neutral' as const;
    case 'error':
      return 'error' as const;
  }
}

export function SessionCard({ session, className }: SessionCardProps) {
  const router = useRouter();

  return (
    <Card
      className={clsx('group', className)}
      onClick={() => router.push(`/session/${session.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <StatusIndicator status={statusToIndicator(session.status)} />
          <span className="text-sm font-medium text-text-primary font-mono">
            {session.id.slice(0, 8)}
          </span>
          <Badge variant={statusVariant(session.status)} size="sm">
            {session.status}
          </Badge>
        </div>
        <span className="text-xs text-text-muted">{formatTimestamp(session.startTime)}</span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
        <span>{session.totalEvents} events</span>
        <span>{formatCost(session.totalCostUsd)}</span>
        {session.cwd && (
          <span className="truncate max-w-[200px] font-mono text-[10px]">{session.cwd}</span>
        )}
      </div>
    </Card>
  );
}
