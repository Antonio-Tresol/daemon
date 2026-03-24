import { NextResponse } from 'next/server';

const SCHEMA_TYPES = [
  'Session',
  'TimelinePlan',
  'Task',
  'Failure',
  'Improvement',
  'HookEvent',
  'AnalysisResult',
] as const;

export async function GET() {
  return NextResponse.json({
    schemas: SCHEMA_TYPES.map((name) => ({
      name,
      url: `/api/agent/schemas/${name}`,
    })),
    _meta: {
      total: SCHEMA_TYPES.length,
      returned: SCHEMA_TYPES.length,
      suggestions: [
        'Fetch a specific schema: GET /api/agent/schemas/Session',
      ],
    },
  });
}
