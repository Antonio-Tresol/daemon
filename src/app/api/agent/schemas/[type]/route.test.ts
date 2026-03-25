import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/server/infrastructure/analysis-schemas', () => ({
  ENTITY_SCHEMAS: {
    Session: { type: 'object', properties: { id: { type: 'string' } } },
    Failure: { type: 'object', properties: { type: { type: 'string' } } },
  },
}));

vi.mock('@/app/api/agent/_lib/response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    agentError: vi.fn((desc: string, code: string, help: string, docs: string, status: number) => {
      return NextResponse.json({ error: desc, code, help }, { status });
    }),
  };
});

import { GET } from './route';

const makeParams = (type: string) => ({ params: Promise.resolve({ type }) });

describe('GET /api/agent/schemas/[type]', () => {
  it('returns schema for valid type', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/schemas/Session');
    const res = await GET(req, makeParams('Session'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.type).toBe('object');
    expect(data.properties.id).toBeDefined();
  });

  it('returns 404 for unknown type', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/schemas/Unknown');
    const res = await GET(req, makeParams('Unknown'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Unknown');
  });
});
