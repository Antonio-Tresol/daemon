import { NextResponse } from 'next/server';

interface MetaOptions {
  total: number;
  returned: number;
  schema: string;
  related?: Record<string, string>;
  suggestions?: string[];
}

export function agentResponse<T>(data: T, meta: MetaOptions) {
  return NextResponse.json({
    data,
    _meta: {
      total: meta.total,
      returned: meta.returned,
      schema: meta.schema,
      related: meta.related ?? {},
      suggestions: meta.suggestions ?? [],
    },
  });
}

export function agentError(
  description: string,
  code: string,
  help: string,
  docsSection: string,
  status: number = 400,
) {
  return NextResponse.json(
    {
      error: description,
      code,
      help,
      docs: `/api/agent/docs#${docsSection}`,
    },
    { status },
  );
}
