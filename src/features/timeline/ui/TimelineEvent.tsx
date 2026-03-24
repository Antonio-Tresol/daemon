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

function ToolIcon({ name, className }: { name: string; className?: string }) {
  const iconClass = cn('h-3.5 w-3.5 shrink-0', className);

  switch (name) {
    case 'Read':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>Read</title>
          <circle cx="8" cy="7" r="3" />
          <path d="M1 7s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
        </svg>
      );
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>{name}</title>
          <path d="M11.5 1.5l3 3-9 9H2.5v-3z" />
          <path d="M9.5 3.5l3 3" />
        </svg>
      );
    case 'Bash':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>Bash</title>
          <rect x="1" y="2" width="14" height="12" rx="2" />
          <path d="M4 6l3 2-3 2" />
          <path d="M9 10h3" />
        </svg>
      );
    case 'Glob':
    case 'Grep':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>{name}</title>
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
      );
    case 'Agent':
    case 'TeamCreate':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>{name}</title>
          <circle cx="6" cy="5" r="2.5" />
          <circle cx="11" cy="5" r="2" />
          <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
          <path d="M11 9c2 0 4 1.5 4 4" />
        </svg>
      );
    case 'TodoWrite':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>Todo</title>
          <rect x="2" y="1" width="12" height="14" rx="2" />
          <path d="M5 5h6M5 8h6M5 11h4" />
        </svg>
      );
    case 'WebFetch':
    case 'WebSearch':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>{name}</title>
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8h12M8 2c2 2 3 4 3 6s-1 4-3 6c-2-2-3-4-3-6s1-4 3-6z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <title>Tool</title>
          <circle cx="8" cy="8" r="2" />
          <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
        </svg>
      );
  }
}

function EventIcon({ event }: { event: HookEvent }) {
  if (event.eventType === 'api_error' || event.eventType === 'PostToolUseFailure') {
    return (
      <svg className="h-3.5 w-3.5 text-status-red" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Error</title>
        <path d="M8 1L1 14h14L8 1z" />
        <path d="M8 6v4M8 12v.5" />
      </svg>
    );
  }
  if (event.eventType === 'api_request') {
    return (
      <svg className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>API</title>
        <path d="M2 4l6-2 6 2v8l-6 2-6-2z" />
        <path d="M2 4l6 2 6-2M8 6v8" />
      </svg>
    );
  }
  if (event.eventType === 'user_prompt') {
    return (
      <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Prompt</title>
        <path d="M4 6l4 2-4 2" />
        <rect x="1" y="2" width="14" height="12" rx="2" />
      </svg>
    );
  }
  if (event.eventType === 'SessionStart') {
    return (
      <svg className="h-3.5 w-3.5 text-status-green" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Start</title>
        <polygon points="5,3 13,8 5,13" />
      </svg>
    );
  }
  if (event.eventType === 'SessionEnd') {
    return (
      <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Stop</title>
        <rect x="4" y="4" width="8" height="8" />
      </svg>
    );
  }
  if (event.toolName) {
    return <ToolIcon name={event.toolName} className="text-foreground/60" />;
  }
  return (
    <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 16 16" fill="currentColor">
      <title>Event</title>
      <circle cx="8" cy="8" r="3" />
    </svg>
  );
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
          <EventIcon event={event} />
          <EventBadge eventType={event.eventType} />
          {event.toolName && (
            <span className="text-xs font-mono text-foreground">{event.toolName}</span>
          )}
          {event.durationMs !== null && (
            <span className="text-[10px] text-muted">{formatDuration(event.durationMs)}</span>
          )}
          <span className="ml-auto text-[10px] text-muted shrink-0">
            {formatTimestamp(event.timestamp)}
          </span>
          {event.success === false && (
            <span className="text-[10px] text-status-red font-medium">failed</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-1 ml-6 rounded-lg bg-background/50 p-3 text-xs">
          <pre className="overflow-x-auto text-[11px] text-muted whitespace-pre-wrap break-words font-mono leading-relaxed">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
