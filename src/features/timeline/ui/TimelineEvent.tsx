'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { EventBadge } from '@/entities/event/ui/EventBadge';
import { formatTimestamp, formatDuration } from '@/shared/lib/format';
import type { HookEvent } from '@/entities/event/model';

type TimelineEventProps = {
  event: HookEvent;
  className?: string;
};

function ToolIcon({ name, className }: { name: string; className?: string }) {
  const iconClass = clsx('h-3.5 w-3.5 shrink-0', className);

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
      <svg className="h-3.5 w-3.5 text-text-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Error</title>
        <path d="M8 1L1 14h14L8 1z" />
        <path d="M8 6v4M8 12v.5" />
      </svg>
    );
  }
  if (event.eventType === 'api_request') {
    return (
      <svg className="h-3.5 w-3.5 text-text-secondary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>API</title>
        <path d="M2 4l6-2 6 2v8l-6 2-6-2z" />
        <path d="M2 4l6 2 6-2M8 6v8" />
      </svg>
    );
  }
  if (event.eventType === 'user_prompt') {
    return (
      <svg className="h-3.5 w-3.5 text-ember" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Prompt</title>
        <path d="M4 6l4 2-4 2" />
        <rect x="1" y="2" width="14" height="12" rx="2" />
      </svg>
    );
  }
  if (event.eventType === 'SessionStart') {
    return (
      <svg className="h-3.5 w-3.5 text-ember" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Start</title>
        <polygon points="5,3 13,8 5,13" />
      </svg>
    );
  }
  if (event.eventType === 'SessionEnd') {
    return (
      <svg className="h-3.5 w-3.5 text-text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <title>Stop</title>
        <rect x="4" y="4" width="8" height="8" />
      </svg>
    );
  }
  if (event.toolName) {
    return <ToolIcon name={event.toolName} className="text-text-secondary" />;
  }
  return (
    <svg className="h-3.5 w-3.5 text-text-muted" viewBox="0 0 16 16" fill="currentColor">
      <title>Event</title>
      <circle cx="8" cy="8" r="3" />
    </svg>
  );
}

function PayloadField({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (!str || str === '""' || str === '{}' || str === '[]') return null;

  const isLong = str.length > 120;
  const isCode = label === 'command' || label === 'old_string' || label === 'new_string' || label === 'content' || label === 'expression';

  return (
    <div className="flex gap-2">
      <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted shrink-0 w-20 text-right pt-0.5">{label}</span>
      {isCode || isLong ? (
        <pre className="flex-1 text-[11px] font-mono text-text-primary whitespace-pre-wrap break-all leading-relaxed max-h-[150px] overflow-y-auto bg-depth-0/50 rounded-sm px-2 py-1">
          {typeof value === 'string' ? value.slice(0, 1500) : JSON.stringify(value, null, 2).slice(0, 1500)}
        </pre>
      ) : (
        <span className="flex-1 text-[11px] font-mono text-text-primary break-all">{str}</span>
      )}
    </div>
  );
}

function EventPayload({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload) {
    return (
      <div className="mt-1 ml-4 bg-depth-2 border border-border rounded-md p-3 depth-reveal">
        <span className="text-[10px] font-mono text-text-muted">No payload data</span>
      </div>
    );
  }

  const toolInput = payload.tool_input as Record<string, unknown> | undefined; // payload values are unknown
  const toolResult = payload.tool_result as string | undefined; // payload values are unknown
  const hookEvent = payload.hook_event_name as string | undefined; // payload values are unknown

  // Key fields to show from tool_input
  const inputFields = toolInput ? Object.entries(toolInput).filter(
    ([k]) => !['type'].includes(k)
  ) : [];

  return (
    <div className="mt-1 ml-4 bg-depth-2 border border-border rounded-md p-3 depth-reveal space-y-2">
      {/* Tool input params rendered as key-value pairs */}
      {inputFields.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider text-ember">Parameters</span>
          <div className="space-y-1">
            {inputFields.map(([key, val]) => (
              <PayloadField key={key} label={key} value={val} />
            ))}
          </div>
        </div>
      )}

      {/* Tool result summary */}
      {toolResult && (
        <div className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted">Result</span>
          <pre className="text-[10px] font-mono text-text-secondary whitespace-pre-wrap break-all leading-relaxed max-h-[120px] overflow-y-auto bg-depth-0/50 rounded-sm px-2 py-1">
            {typeof toolResult === 'string' ? toolResult.slice(0, 1000) : JSON.stringify(toolResult, null, 2).slice(0, 1000)}
          </pre>
        </div>
      )}

      {/* Collapsed full payload */}
      <details className="text-[10px]">
        <summary className="font-mono text-text-muted cursor-pointer hover:text-text-secondary">
          {hookEvent ?? 'raw payload'}
        </summary>
        <pre className="mt-1 text-[10px] text-text-muted whitespace-pre-wrap break-all font-mono leading-relaxed max-h-[200px] overflow-y-auto">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function TimelineEvent({ event, className }: TimelineEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={clsx('group relative', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left border-l-2 border-l-ember p-2.5 transition-colors duration-300 hover:bg-depth-0/50"
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
            <span className="text-[10px] font-mono text-text-primary font-medium ml-auto">{'\u2717'} failed</span>
          )}
        </div>
      </button>

      {isExpanded && <EventPayload payload={event.payload} />}
    </div>
  );
}
