import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import type { EventType } from '@/entities/event/model';

type EventBadgeProps = {
  eventType: EventType;
  className?: string;
};

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

function getVariant(eventType: EventType): BadgeVariant {
  switch (eventType) {
    case 'PostToolUseFailure':
    case 'api_error':
      return 'error';
    case 'PostToolUse':
    case 'tool_result':
    case 'tool_decision':
      return 'info';
    case 'PreToolUse':
      return 'info';
    case 'SessionStart':
    case 'SessionEnd':
    case 'SubagentStart':
    case 'SubagentStop':
      return 'neutral';
    case 'Stop':
    case 'Notification':
      return 'warning';
    case 'api_request':
      return 'info';
    case 'user_prompt':
      return 'success';
    default:
      return 'neutral';
  }
}

function getLabel(eventType: EventType): string {
  switch (eventType) {
    case 'PreToolUse': return 'Pre Tool';
    case 'PostToolUse': return 'Post Tool';
    case 'PostToolUseFailure': return 'Tool Fail';
    case 'Stop': return 'Stop';
    case 'SessionStart': return 'Session Start';
    case 'SessionEnd': return 'Session End';
    case 'Notification': return 'Notification';
    case 'SubagentStart': return 'Subagent Start';
    case 'SubagentStop': return 'Subagent Stop';
    case 'api_request': return 'API Request';
    case 'api_error': return 'API Error';
    case 'user_prompt': return 'User Prompt';
    case 'tool_result': return 'Tool Result';
    case 'tool_decision': return 'Tool Decision';
    default: return eventType;
  }
}

export function EventBadge({ eventType, className }: EventBadgeProps) {
  return (
    <Badge variant={getVariant(eventType)} size="sm" className={cn(className)}>
      {getLabel(eventType)}
    </Badge>
  );
}
