import { describe, it, expect, vi } from 'vitest';
import {
  HookEvent,
  VALID_EVENT_TYPES,
  normalizeEventType,
  createHookEvent,
  type EventType,
} from './event.entity';

describe('VALID_EVENT_TYPES', () => {
  it('contains all expected event types', () => {
    const expected: EventType[] = [
      'PreToolUse',
      'PostToolUse',
      'PostToolUseFailure',
      'Stop',
      'SessionStart',
      'SessionEnd',
      'Notification',
      'SubagentStart',
      'SubagentStop',
      'api_request',
      'api_error',
      'user_prompt',
      'tool_result',
      'tool_decision',
    ];
    for (const t of expected) {
      expect(VALID_EVENT_TYPES.has(t)).toBe(true);
    }
    expect(VALID_EVENT_TYPES.size).toBe(expected.length);
  });
});

describe('normalizeEventType', () => {
  it('returns valid event types as-is', () => {
    expect(normalizeEventType('PreToolUse')).toBe('PreToolUse');
    expect(normalizeEventType('Stop')).toBe('Stop');
    expect(normalizeEventType('api_error')).toBe('api_error');
    expect(normalizeEventType('tool_decision')).toBe('tool_decision');
  });

  it('maps unknown strings containing "error" to api_error', () => {
    expect(normalizeEventType('some_error_event')).toBe('api_error');
    expect(normalizeEventType('connection_error')).toBe('api_error');
  });

  it('maps unknown strings containing "request" to api_request', () => {
    expect(normalizeEventType('http_request')).toBe('api_request');
    expect(normalizeEventType('outbound_request_log')).toBe('api_request');
  });

  it('maps unknown strings containing "tool" to tool_result', () => {
    expect(normalizeEventType('custom_tool_event')).toBe('tool_result');
  });

  it('falls back to Notification for unrecognized strings', () => {
    expect(normalizeEventType('random_unknown')).toBe('Notification');
    expect(normalizeEventType('')).toBe('Notification');
    expect(normalizeEventType('xyz')).toBe('Notification');
  });

  it('prioritizes "error" over "request" and "tool" when multiple keywords match', () => {
    // "error" is checked first in the chain
    expect(normalizeEventType('tool_error')).toBe('api_error');
    expect(normalizeEventType('request_error')).toBe('api_error');
  });
});

describe('HookEvent', () => {
  it('constructs with all fields', () => {
    const event = new HookEvent(
      'evt-1',
      'sess-1',
      '2025-01-01T00:00:00Z',
      'PreToolUse',
      'Read',
      true,
      150,
      'prompt-1',
      { cost_usd: 0.05, extra: 'data' },
    );

    expect(event.id).toBe('evt-1');
    expect(event.sessionId).toBe('sess-1');
    expect(event.timestamp).toBe('2025-01-01T00:00:00Z');
    expect(event.eventType).toBe('PreToolUse');
    expect(event.toolName).toBe('Read');
    expect(event.success).toBe(true);
    expect(event.durationMs).toBe(150);
    expect(event.promptId).toBe('prompt-1');
    expect(event.payload).toEqual({ cost_usd: 0.05, extra: 'data' });
  });

  describe('costUsd getter', () => {
    it('returns cost_usd from payload when it is a number', () => {
      const event = new HookEvent('e1', 's1', 'ts', 'Stop', null, null, null, null, {
        cost_usd: 1.23,
      });
      expect(event.costUsd).toBe(1.23);
    });

    it('returns 0 when cost_usd is not a number', () => {
      const event = new HookEvent('e1', 's1', 'ts', 'Stop', null, null, null, null, {
        cost_usd: 'not-a-number',
      });
      expect(event.costUsd).toBe(0);
    });

    it('returns 0 when cost_usd is missing from payload', () => {
      const event = new HookEvent('e1', 's1', 'ts', 'Stop', null, null, null, null, {});
      expect(event.costUsd).toBe(0);
    });

    it('returns 0 for zero cost', () => {
      const event = new HookEvent('e1', 's1', 'ts', 'Stop', null, null, null, null, {
        cost_usd: 0,
      });
      expect(event.costUsd).toBe(0);
    });
  });
});

describe('createHookEvent', () => {
  it('creates an event with all parameters provided', () => {
    const event = createHookEvent({
      id: 'evt-1',
      sessionId: 'sess-1',
      timestamp: '2025-06-01T12:00:00Z',
      eventType: 'PostToolUse',
      toolName: 'Write',
      success: true,
      durationMs: 200,
      promptId: 'p-1',
      payload: { cost_usd: 0.1 },
    });

    expect(event).toBeInstanceOf(HookEvent);
    expect(event.id).toBe('evt-1');
    expect(event.sessionId).toBe('sess-1');
    expect(event.timestamp).toBe('2025-06-01T12:00:00Z');
    expect(event.eventType).toBe('PostToolUse');
    expect(event.toolName).toBe('Write');
    expect(event.success).toBe(true);
    expect(event.durationMs).toBe(200);
    expect(event.promptId).toBe('p-1');
    expect(event.costUsd).toBe(0.1);
  });

  it('defaults optional fields when not provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-01T00:00:00Z'));

    const event = createHookEvent({
      id: 'evt-2',
      sessionId: 'sess-2',
      eventType: 'random_unknown',
    });

    expect(event.timestamp).toBe('2025-03-01T00:00:00.000Z');
    expect(event.eventType).toBe('Notification'); // normalized
    expect(event.toolName).toBeNull();
    expect(event.success).toBeNull();
    expect(event.durationMs).toBeNull();
    expect(event.promptId).toBeNull();
    expect(event.payload).toEqual({});
    expect(event.costUsd).toBe(0);

    vi.useRealTimers();
  });

  it('normalizes the event type', () => {
    const event = createHookEvent({
      id: 'evt-3',
      sessionId: 'sess-3',
      eventType: 'some_error',
    });
    expect(event.eventType).toBe('api_error');
  });
});
