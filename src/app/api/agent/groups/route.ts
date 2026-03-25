import { agentResponse, agentError } from '../_lib/response';

export async function GET() {
  try {
    const { getDatabase } = await import('@/server/infrastructure/db/sqlite');
    const db = getDatabase();

    const rows = db.prepare(
      'SELECT DISTINCT group_label FROM sessions WHERE group_label IS NOT NULL ORDER BY group_label ASC',
    ).all() as Array<{ group_label: string }>; // .all() returns unknown[]

    const groups = rows.map((r) => r.group_label);

    return agentResponse(groups, {
      total: groups.length,
      returned: groups.length,
      schema: '/api/agent/schemas/Group',
      suggestions: groups.length > 0
        ? [`Try: GET /api/agent/sessions?group=${groups[0]}`]
        : ['No groups found. Assign group labels to sessions first.'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'groups', 500);
  }
}
