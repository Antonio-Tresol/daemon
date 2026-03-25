import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindById = vi.fn().mockReturnValue(null);

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return { findById: mockFindById };
  }),
}));

import { GET } from './route';

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('GET /api/analysis/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns analysis when found', async () => {
    const analysis = {
      id: 'a1',
      sessionId: 's1',
      analysisType: 'timeline',
      status: 'completed',
      result: { plans: [] },
    };
    mockFindById.mockReturnValue(analysis);

    const req = new NextRequest('http://localhost:3000/api/analysis/a1');
    const res = await GET(req, makeParams('a1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('a1');
  });

  it('returns 404 when not found', async () => {
    mockFindById.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/analysis/missing');
    const res = await GET(req, makeParams('missing'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Analysis not found');
  });
});
