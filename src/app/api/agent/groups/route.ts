import { SqliteSessionRepository } from '@/server/infrastructure/db/session.sqlite-repo';
import { agentError, agentResponse } from '../_lib/response';

export async function GET() {
  try {
    const sessionRepo = new SqliteSessionRepository();
    const groups = sessionRepo.findGroups();

    return agentResponse(groups, {
      total: groups.length,
      returned: groups.length,
      schema: '/api/agent/schemas/Group',
      suggestions:
        groups.length > 0
          ? [`Try: GET /api/agent/sessions?group=${groups[0]}`]
          : ['No groups found. Assign group labels to sessions first.'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return agentError(message, 'INTERNAL_ERROR', 'Check server logs', 'groups', 500);
  }
}
