import { buildEventSummarySync } from './build-event-summary';

type MockEvent = {
  id: string;
  timestamp: string;
  event_type: string;
  tool_name: string | null;
  success: number | null;
  duration_ms: number | null;
};

function createMockDb(events: MockEvent[]) {
  return {
    prepare: () => ({
      all: () => events,
    }),
  } as unknown as Parameters<typeof buildEventSummarySync>[0];
}

describe('buildEventSummarySync', () => {
  it('returns "No events found." for empty events', () => {
    const db = createMockDb([]);
    expect(buildEventSummarySync(db, 'session-1')).toBe('No events found.');
  });

  it('produces valid markdown for a single event', () => {
    const db = createMockDb([
      {
        id: 'e1',
        timestamp: '2026-03-25T10:00:00.000Z',
        event_type: 'ToolUse',
        tool_name: 'Read',
        success: 1,
        duration_ms: 100,
      },
    ]);

    const result = buildEventSummarySync(db, 'session-1');
    expect(result).toContain('## Event Summary');
    expect(result).toContain('**Total events**: 1');
    expect(result).toContain('**Failures**: 0');
    expect(result).toContain('ToolUse: 1');
    expect(result).toContain('Read: 1');
  });

  it('counts failures correctly', () => {
    const db = createMockDb([
      {
        id: 'e1',
        timestamp: '2026-03-25T10:00:00.000Z',
        event_type: 'PostToolUseFailure',
        tool_name: 'Write',
        success: 0,
        duration_ms: 50,
      },
      {
        id: 'e2',
        timestamp: '2026-03-25T10:00:01.000Z',
        event_type: 'ToolUse',
        tool_name: 'Read',
        success: 0,
        duration_ms: 30,
      },
    ]);

    const result = buildEventSummarySync(db, 'session-1');
    expect(result).toContain('**Failures**: 2');
    expect(result).toContain('### Failures:');
    expect(result).toContain('Write');
    expect(result).toContain('Read');
  });

  it('groups events in the same 5-min window', () => {
    const db = createMockDb([
      {
        id: 'e1',
        timestamp: '2026-03-25T10:00:00.000Z',
        event_type: 'ToolUse',
        tool_name: 'Read',
        success: 1,
        duration_ms: 100,
      },
      {
        id: 'e2',
        timestamp: '2026-03-25T10:02:00.000Z',
        event_type: 'ToolUse',
        tool_name: 'Write',
        success: 1,
        duration_ms: 200,
      },
      {
        id: 'e3',
        timestamp: '2026-03-25T10:10:00.000Z',
        event_type: 'ToolUse',
        tool_name: 'Bash',
        success: 1,
        duration_ms: 300,
      },
    ]);

    const result = buildEventSummarySync(db, 'session-1');
    // First window should contain Read and Write grouped together
    expect(result).toContain('Read → Write');
    // Second window should be separate
    expect(result).toContain('Bash');
    // Should have 2 windows
    const windowLines = result.split('\n').filter(l => /^\d+\.\s\[/.test(l));
    expect(windowLines).toHaveLength(2);
  });

  it('handles events without tool_name', () => {
    const db = createMockDb([
      {
        id: 'e1',
        timestamp: '2026-03-25T10:00:00.000Z',
        event_type: 'SessionStart',
        tool_name: null,
        success: 1,
        duration_ms: null,
      },
    ]);

    const result = buildEventSummarySync(db, 'session-1');
    expect(result).toContain('**Total events**: 1');
    expect(result).toContain('SessionStart: 1');
  });
});
