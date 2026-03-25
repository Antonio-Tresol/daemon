import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindPaginated = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return { findPaginated: mockFindPaginated };
  }),
}));

import { GET } from './route';

describe('GET /api/agent/failures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns failures from completed analysis', async () => {
    const failures = [
      { timestamp: '2025-01-01', type: 'tool_failure', description: 'Test', rootCause: 'bug', impact: 'critical', eventId: null },
    ];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { failures } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/failures?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toEqual(failures);
  });

  it('filters by impact', async () => {
    const failures = [
      { timestamp: '2025-01-01', type: 'tool_failure', description: 'A', rootCause: 'x', impact: 'critical', eventId: null },
      { timestamp: '2025-01-01', type: 'tool_failure', description: 'B', rootCause: 'y', impact: 'warning', eventId: null },
    ];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { failures } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/failures?sessionId=s1&impact=critical');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
    expect(data.data[0].description).toBe('A');
  });

  it('filters by type', async () => {
    const failures = [
      { timestamp: '2025-01-01', type: 'tool_failure', description: 'A', rootCause: 'x', impact: 'critical', eventId: null },
      { timestamp: '2025-01-01', type: 'api_error', description: 'B', rootCause: 'y', impact: 'warning', eventId: null },
    ];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { failures } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/failures?sessionId=s1&type=api_error');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
    expect(data.data[0].type).toBe('api_error');
  });

  it('returns 400 when sessionId missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/failures');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns empty when no completed analysis', async () => {
    mockFindPaginated.mockReturnValue([]);

    const req = new NextRequest('http://localhost:3000/api/agent/failures?sessionId=s1');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toEqual([]);
  });
});
