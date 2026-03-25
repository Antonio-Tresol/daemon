import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindById = vi.fn().mockReturnValue(null);

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return { findById: mockFindById };
  }),
}));

vi.mock('@/shared/lib/parse-json', () => ({
  unwrapRawOutput: vi.fn((v: unknown) => v),
}));

import { GET } from './route';

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('GET /api/agent/analysis/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns analysis with meta when found', async () => {
    const row = {
      id: 'a1',
      sessionId: 's1',
      analysisType: 'timeline',
      status: 'completed',
      level: 0,
      triggeredAt: '2025-01-01T00:00:00Z',
      completedAt: '2025-01-01T00:01:00Z',
      result: { plans: [] },
      error: null,
    };
    mockFindById.mockReturnValue(row);

    const req = new NextRequest('http://localhost:3000/api/agent/analysis/a1');
    const res = await GET(req, makeParams('a1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.id).toBe('a1');
    expect(data._meta).toBeDefined();
    expect(data._meta.suggestions).toBeDefined();
  });

  it('returns 404 when not found', async () => {
    mockFindById.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/agent/analysis/missing');
    const res = await GET(req, makeParams('missing'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

  it('includes poll suggestion for pending analysis', async () => {
    mockFindById.mockReturnValue({
      id: 'a1',
      sessionId: 's1',
      analysisType: 'timeline',
      status: 'pending',
      level: 0,
      triggeredAt: '2025-01-01T00:00:00Z',
      completedAt: null,
      result: null,
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/agent/analysis/a1');
    const res = await GET(req, makeParams('a1'));
    const data = await res.json();
    expect(data._meta.suggestions.some((s: string) => s.includes('pending'))).toBe(true);
  });
});
