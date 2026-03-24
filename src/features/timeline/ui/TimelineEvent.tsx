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

const EVENT_BORDER_COLORS: Record<string, string> = {
  api_error: 'border-l-signal-red',
  PostToolUseFailure: 'border-l-signal-red',
  api_request: 'border-l-signal-blue',
  user_prompt: 'border-l-signal-green',
  SessionStart: 'border-l-signal-green',
  SessionEnd: 'border-l-sediment',
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
      <svg className="h-3.5 w-3.5 text-signal-red" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Error</title>
        <path d="M8 1L1 14h14L8 1z" />
        <path d="M8 6v4M8 12v.5" />
      </svg>
    );
  }
  if (event.eventType === 'api_request') {
    return (
      <svg className="h-3.5 w-3.5 text-signal-blue" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>API</title>
        <path d="M2 4l6-2 6 2v8l-6 2-6-2z" />
        <path d="M2 4l6 2 6-2M8 6v8" />
      </svg>
    );
  }
  if (event.eventType === 'user_prompt') {
    return (
      <svg className="h-3.5 w-3.5 text-signal-green" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Prompt</title>
        <path d="M4 6l4 2-4 2" />
        <rect x="1" y="2" width="14" height="12" rx="2" />
      </svg>
    );
  }
  if (event.eventType === 'SessionStart') {
    return (
      <svg className="h-3.5 w-3.5 text-signal-green" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Start</title>
        <polygon points="5,3 13,8 5,13" />
      </svg>
    );
  }
  if (event.eventType === 'SessionEnd') {
    return (
      <svg className="h-3.5 w-3.5 text-sediment" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Stop</title>
        <rect x="4" y="4" width="8" height="8" />
      </svg>
    );
  }
  if (event.toolName) {
    return <ToolIcon name={event.toolName} className="text-text-secondary" />;
  }
  return (
    <svg className="h-3.5 w-3.5 text-sediment" viewBox="0 0 16 16" fill="currentColor">
      <title>Event</title>
      <circle cx="8" cy="8" r="3" />
    </svg>
  );
}

export function TimelineEvent({ event, className }: TimelineEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const borderColor = EVENT_BORDER_COLORS[event.eventType] ?? (event.toolName ? 'border-l-sediment' : 'border-l-border');

  return (
    <div className={cn('group relative', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full text-left border-l-2 p-2.5 transition-colors duration-300 hover:bg-depth-0/50',
          borderColor,
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-text-muted shrink-0">
            {formatTimestamp(event.timestamp)}
          </span>
          <EventIcon event={event} />
          <EventBadge eventType={event.eventType} />
          {event.toolName && (
            <span className="text-xs font-mono text-text-primary">{event.toolName}</span>
          )}
          {event.durationMs !== null && (
            <span className="text-[10px] font-mono text-text-muted">{formatDuration(event.durationMs)}</span>
          )}
          {event.success === false && (
            <span className="text-[10px] font-mono text-signal-red font-medium ml-auto">failed</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-1 ml-4 bg-depth-2 border border-border p-3 text-xs depth-reveal">
          <pre className="overflow-x-auto text-[11px] text-text-secondary whitespace-pre-wrap break-words font-mono leading-relaxed">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
