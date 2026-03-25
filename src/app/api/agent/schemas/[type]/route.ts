import { type NextRequest, NextResponse } from 'next/server';
import { ENTITY_SCHEMAS } from '@/server/infrastructure/analysis-schemas';
import { agentError } from '../../_lib/response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  const schema = ENTITY_SCHEMAS[type];
  if (!schema) {
    const validTypes = Object.keys(ENTITY_SCHEMAS);
    return agentError(
      `Unknown schema type: ${type}`,
      'NOT_FOUND',
      `Valid types: ${validTypes.join(', ')}`,
      'schemas',
      404,
    );
  }

  return NextResponse.json(schema);
}
