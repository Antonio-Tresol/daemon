import type Database from 'better-sqlite3';

/** Build a compact event summary from the DB so the agent has a map without querying */
export function buildEventSummarySync(db: Database.Database, sessionId: string): string {
  const events = db.prepare(
    'SELECT id, timestamp, event_type, tool_name, success, duration_ms FROM events WHERE session_id = ? ORDER BY timestamp ASC',
  ).all(sessionId) as Array<{ // .all() returns unknown[]
    id: string;
    timestamp: string;
    event_type: string;
    tool_name: string | null;
    success: number | null;
    duration_ms: number | null;
  }>;

  if (events.length === 0) return 'No events found.';

  // Build summary stats
  const byType: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  const failures: Array<{ ts: string; tool: string | null; id: string }> = [];
  const firstTs = events[0].timestamp;
  const lastTs = events[events.length - 1].timestamp;

  for (const e of events) {
    byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
    if (e.tool_name) byTool[e.tool_name] = (byTool[e.tool_name] ?? 0) + 1;
    if (e.event_type === 'PostToolUseFailure' || e.success === 0) {
      failures.push({ ts: e.timestamp, tool: e.tool_name, id: e.id });
    }
  }

  // Build compact chronological sequence (tool names in order, grouped by 5-min windows)
  const windows: Array<{ start: string; tools: string[] }> = [];
  let currentWindow: { start: string; tools: string[] } | null = null;
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  for (const e of events) {
    if (!e.tool_name) continue;
    const ts = new Date(e.timestamp).getTime();
    if (!currentWindow || ts - new Date(currentWindow.start).getTime() > WINDOW_MS) {
      currentWindow = { start: e.timestamp, tools: [] };
      windows.push(currentWindow);
    }
    currentWindow.tools.push(e.tool_name);
  }

  const lines: string[] = [
    `## Event Summary`,
    ``,
    `**Total events**: ${events.length}`,
    `**Time range**: ${firstTs} to ${lastTs}`,
    `**Failures**: ${failures.length}`,
    ``,
    `### Events by type:`,
    ...Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, c]) => `- ${t}: ${c}`),
    ``,
    `### Events by tool:`,
    ...Object.entries(byTool).sort((a, b) => b[1] - a[1]).map(([t, c]) => `- ${t}: ${c}`),
    ``,
    `### Chronological sequence (5-min windows):`,
    ...windows.map((w, i) => `${i + 1}. [${w.start.slice(11, 19)}] ${w.tools.join(' → ')}`),
  ];

  if (failures.length > 0) {
    lines.push(``, `### Failures:`, ...failures.map(f => `- [${f.ts.slice(11, 19)}] ${f.tool ?? 'unknown'} (id: ${f.id})`));
  }

  return lines.join('\n');
}
