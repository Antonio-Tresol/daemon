import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindById = vi.fn().mockReturnValue(null);
const mockUpdate = vi.fn();

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return { findById: mockFindById, update: mockUpdate };
  }),
}));

import { POST } from './route';

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('POST /api/agent/analysis/[id]/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits result and returns success', async () => {
    const row = {
      id: 'a1',
      sessionId: 's1',
      analysisType: 'timeline',
      status: 'running',
      level: 0,
      triggeredAt: '2025-01-01T00:00:00Z',
      completedAt: null,
      result: null,
      error: null,
    };
    mockFindById.mockReturnValue(row);

    const req = new NextRequest('http://localhost:3000/api/agent/analysis/a1/submit', {
      method: 'POST',
      body: JSON.stringify({ result: { plans: [{ name: 'Plan 1' }] } }),
    });
    const res = await POST(req, makeParams('a1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.id).toBe('a1');
    expect(data.data.status).toBe('completed');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('returns 404 when analysis not found', async () => {
    mockFindById.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/agent/analysis/missing/submit', {
      method: 'POST',
      body: JSON.stringify({ result: { plans: [] } }),
    });
    const res = await POST(req, makeParams('missing'));
    expect(res.status).toBe(404);
  });

  it('returns 400 when result missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/analysis/a1/submit', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req, makeParams('a1'));
    expect(res.status).toBe(400);
  });

  it('merges arrays when append=true', async () => {
    const row = {
      id: 'a1',
      sessionId: 's1',
      analysisType: 'timeline',
      status: 'running',
      level: 0,
      triggeredAt: '2025-01-01T00:00:00Z',
      completedAt: null,
      result: { plans: [{ name: 'Plan 1' }] },
      error: null,
    };
    mockFindById.mockReturnValue(row);

    const req = new NextRequest('http://localhost:3000/api/agent/analysis/a1/submit', {
      method: 'POST',
      body: JSON.stringify({ result: { plans: [{ name: 'Plan 2' }] }, append: true }),
    });
    const res = await POST(req, makeParams('a1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.merged).toBe(true);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.result.plans).toHaveLength(2);
  });

  it('accepts failed status', async () => {
    const row = {
      id: 'a1',
      sessionId: 's1',
      analysisType: 'timeline',
      status: 'running',
      level: 0,
      triggeredAt: '2025-01-01T00:00:00Z',
      completedAt: null,
      result: null,
      error: null,
    };
    mockFindById.mockReturnValue(row);

    const req = new NextRequest('http://localhost:3000/api/agent/analysis/a1/submit', {
      method: 'POST',
      body: JSON.stringify({ status: 'failed', error: 'Something broke', result: null }),
    });
    const res = await POST(req, makeParams('a1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('failed');
  });
});
