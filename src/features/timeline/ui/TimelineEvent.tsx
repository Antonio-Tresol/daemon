'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { EventBadge } from '@/entities/event/ui/EventBadge';
import { formatTimestamp, formatDuration } from '@/shared/lib/format';
import type { HookEvent } from '@/entities/event/model';

type TimelineEventProps = {
  event: HookEvent;
  className?: string;
};

function getEventIcon(event: HookEvent): string {
  if (event.eventType === 'api_error' || event.eventType === 'PostToolUseFailure') return '!';
  if (event.eventType === 'api_request') return '~';
  if (event.eventType === 'user_prompt') return '>';
  if (event.toolName) return '#';
  return '.';
}

export function TimelineEvent({ event, className }: TimelineEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('group relative pl-6', className)}>
      {/* Connector dot */}
      <div className="absolute left-0 top-2 flex h-4 w-4 items-center justify-center">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            event.success === false ? 'bg-status-red' : 'bg-accent/60',
          )}
        />
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left rounded-lg p-2.5 transition-colors hover:bg-card-border/30"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted">{getEventIcon(event)}</span>
          <EventBadge eventType={event.eventType} />
          {event.toolName && (
            <span className="text-xs font-mono text-foreground">{event.toolName}</span>
          )}
          {event.durationMs !== null && (
            <span className="text-[10px] text-muted">{formatDuration(event.durationMs)}</span>
          )}
          <span className="ml-auto text-[10px] text-muted">
            {formatTimestamp(event.timestamp)}
          </span>
          {event.success === false && (
            <span className="text-[10px] text-status-red font-medium">failed</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-1 ml-6 rounded-lg bg-background/50 p-3 text-xs">
          <pre className="overflow-x-auto text-[11px] text-muted whitespace-pre-wrap font-mono leading-relaxed">
            {JSON.stringify(event.payload, null, 2).slice(0, 500)}
          </pre>
        </div>
      )}
    </div>
  );
}
