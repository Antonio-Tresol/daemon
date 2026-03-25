import { HookEvent } from '../domain/event/event.entity';
import type { EventRepository } from '../domain/event/event.repository';
import { buildEventSummary } from './build-event-summary';

function createMockRepo(events: HookEvent[]): EventRepository {
  return {
    findBySessionId: () => events,
    save: () => {},
    findByTimeRange: () => [],
    findByType: () => [],
    countBySessionId: () => events.length,
    findPaginated: () => events,
  };
}

function makeEvent(
  overrides: Partial<{
    id: string;
    timestamp: string;
    eventType: string;
    toolName: string | null;
    success: boolean | null;
    durationMs: number | null;
  }>,
): HookEvent {
  return new HookEvent(
    overrides.id ?? 'e1',
    'session-1',
    overrides.timestamp ?? '2026-03-25T10:00:00.000Z',
    (overrides.eventType ?? 'ToolUse') as HookEvent['eventType'], // test helper — string narrowed to union type
    overrides.toolName ?? null,
    overrides.success ?? null,
    overrides.durationMs ?? null,
    null,
    {},
  );
}

describe('buildEventSummary', () => {
  it('returns "No events found." for empty events', () => {
    const repo = createMockRepo([]);
    expect(buildEventSummary(repo, 'session-1')).toBe('No events found.');
  });

  it('produces valid markdown for a single event', () => {
    const repo = createMockRepo([
      makeEvent({
        id: 'e1',
        eventType: 'ToolUse',
        toolName: 'Read',
        success: true,
        durationMs: 100,
      }),
    ]);

    const result = buildEventSummary(repo, 'session-1');
    expect(result).toContain('## Event Summary');
    expect(result).toContain('**Total events**: 1');
    expect(result).toContain('**Failures**: 0');
    expect(result).toContain('ToolUse: 1');
    expect(result).toContain('Read: 1');
  });

  it('counts failures correctly', () => {
    const repo = createMockRepo([
      makeEvent({
        id: 'e1',
        timestamp: '2026-03-25T10:00:00.000Z',
        eventType: 'PostToolUseFailure',
        toolName: 'Write',
        success: false,
        durationMs: 50,
      }),
      makeEvent({
        id: 'e2',
        timestamp: '2026-03-25T10:00:01.000Z',
        eventType: 'ToolUse',
        toolName: 'Read',
        success: false,
        durationMs: 30,
      }),
    ]);

    const result = buildEventSummary(repo, 'session-1');
    expect(result).toContain('**Failures**: 2');
    expect(result).toContain('### Failures:');
    expect(result).toContain('Write');
    expect(result).toContain('Read');
  });

  it('groups events in the same 5-min window', () => {
    const repo = createMockRepo([
      makeEvent({
        id: 'e1',
        timestamp: '2026-03-25T10:00:00.000Z',
        eventType: 'ToolUse',
        toolName: 'Read',
        success: true,
        durationMs: 100,
      }),
      makeEvent({
        id: 'e2',
        timestamp: '2026-03-25T10:02:00.000Z',
        eventType: 'ToolUse',
        toolName: 'Write',
        success: true,
        durationMs: 200,
      }),
      makeEvent({
        id: 'e3',
        timestamp: '2026-03-25T10:10:00.000Z',
        eventType: 'ToolUse',
        toolName: 'Bash',
        success: true,
        durationMs: 300,
      }),
    ]);

    const result = buildEventSummary(repo, 'session-1');
    expect(result).toContain('Read → Write');
    expect(result).toContain('Bash');
    const windowLines = result.split('\n').filter((l) => /^\d+\.\s\[/.test(l));
    expect(windowLines).toHaveLength(2);
  });

  it('handles events without tool_name', () => {
    const repo = createMockRepo([
      makeEvent({ id: 'e1', eventType: 'SessionStart', toolName: null, success: true }),
    ]);

    const result = buildEventSummary(repo, 'session-1');
    expect(result).toContain('**Total events**: 1');
    expect(result).toContain('SessionStart: 1');
  });
});
