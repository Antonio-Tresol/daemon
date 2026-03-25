import type { EventRepository } from '../domain/event/event.repository';

/** Build a compact event summary so the agent has a map without querying */
export function buildEventSummary(eventRepo: EventRepository, sessionId: string): string {
  const events = eventRepo.findBySessionId(sessionId);

  if (events.length === 0) return 'No events found.';

  // Build summary stats
  const byType: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  const failures: Array<{ ts: string; tool: string | null; id: string }> = [];
  const firstTs = events[0].timestamp;
  const lastTs = events[events.length - 1].timestamp;

  for (const e of events) {
    byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
    if (e.toolName) byTool[e.toolName] = (byTool[e.toolName] ?? 0) + 1;
    if (e.eventType === 'PostToolUseFailure' || e.success === false) {
      failures.push({ ts: e.timestamp, tool: e.toolName, id: e.id });
    }
  }

  // Build compact chronological sequence (tool names in order, grouped by 5-min windows)
  const windows: Array<{ start: string; tools: string[] }> = [];
  let currentWindow: { start: string; tools: string[] } | null = null;
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  for (const e of events) {
    if (!e.toolName) continue;
    const ts = new Date(e.timestamp).getTime();
    if (!currentWindow || ts - new Date(currentWindow.start).getTime() > WINDOW_MS) {
      currentWindow = { start: e.timestamp, tools: [] };
      windows.push(currentWindow);
    }
    currentWindow.tools.push(e.toolName);
  }

  const lines: string[] = [
    `## Event Summary`,
    ``,
    `**Total events**: ${events.length}`,
    `**Time range**: ${firstTs} to ${lastTs}`,
    `**Failures**: ${failures.length}`,
    ``,
    `### Events by type:`,
    ...Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `- ${t}: ${c}`),
    ``,
    `### Events by tool:`,
    ...Object.entries(byTool)
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `- ${t}: ${c}`),
    ``,
    `### Chronological sequence (5-min windows):`,
    ...windows.map((w, i) => `${i + 1}. [${w.start.slice(11, 19)}] ${w.tools.join(' → ')}`),
  ];

  if (failures.length > 0) {
    lines.push(
      ``,
      `### Failures:`,
      ...failures.map((f) => `- [${f.ts.slice(11, 19)}] ${f.tool ?? 'unknown'} (id: ${f.id})`),
    );
  }

  return lines.join('\n');
}
