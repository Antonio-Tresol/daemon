'use client';

import { cn } from '@/shared/lib/cn';
import { Card } from '@/shared/ui/Card';
import { StatusIndicator } from '@/shared/ui/StatusIndicator';
import { Badge } from '@/shared/ui/Badge';
import { EventBadge } from '@/entities/event/ui/EventBadge';
import { formatTimestamp, formatDuration, formatCost } from '@/shared/lib/format';
import { useSessionEvents } from '@/features/session/model/use-session';
import type { Session } from '@/entities/session/model';

type SessionOverviewProps = {
  session: Session;
  className?: string;
};

export function SessionOverview({ session, className }: SessionOverviewProps) {
  const { events, isLoading } = useSessionEvents(session.id, 20);

  const duration =
    session.endTime
      ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      : Date.now() - new Date(session.startTime).getTime();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Metadata panel */}
      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Status</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusIndicator
                status={session.status === 'active' ? 'active' : session.status === 'error' ? 'error' : 'completed'}
              />
              <Badge
                variant={session.status === 'active' ? 'success' : session.status === 'error' ? 'error' : 'neutral'}
                size="sm"
              >
                {session.status}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Duration</p>
            <p className="mt-1 text-sm font-medium text-foreground">{formatDuration(duration)}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Events</p>
            <p className="mt-1 text-sm font-medium text-foreground">{session.totalEvents}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Cost</p>
            <p className="mt-1 text-sm font-medium text-foreground">{formatCost(session.totalCostUsd)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span>Started: {formatTimestamp(session.startTime)}</span>
          {session.endTime && <span>Ended: {formatTimestamp(session.endTime)}</span>}
        </div>
      </Card>

      {/* Mini timeline */}
      <Card title="Recent Events">
        {isLoading ? (
          <p className="text-xs text-muted py-4 text-center">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">No events recorded</p>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-card-border/30 transition-colors"
              >
                <EventBadge eventType={event.eventType} />
                {event.toolName && (
                  <span className="font-mono text-foreground/70">{event.toolName}</span>
                )}
                {event.durationMs !== null && (
                  <span className="text-muted">{formatDuration(event.durationMs)}</span>
                )}
                {event.success === false && (
                  <span className="text-status-red text-[10px]">failed</span>
                )}
                <span className="ml-auto text-[10px] text-muted">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
