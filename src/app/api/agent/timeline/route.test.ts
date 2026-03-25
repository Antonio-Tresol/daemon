import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindPaginated = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return { findPaginated: mockFindPaginated };
  }),
}));

import { GET } from './route';

describe('GET /api/agent/timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns timeline plans from completed analysis', async () => {
    const plans = [{ name: 'Plan 1', phase: 'research', tasks: [] }];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { plans } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/timeline?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toEqual(plans);
    expect(data._meta.total).toBe(1);
  });

  it('returns empty array when no completed analysis', async () => {
    mockFindPaginated.mockReturnValue([
      { status: 'running', result: null },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/timeline?sessionId=s1');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toEqual([]);
    expect(data._meta.suggestions).toBeDefined();
  });

  it('returns 400 when sessionId missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/timeline');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('sessionId');
  });

  it('returns 500 on error', async () => {
    mockFindPaginated.mockImplementation(() => {
      throw new Error('DB error');
    });

    const req = new NextRequest('http://localhost:3000/api/agent/timeline?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
