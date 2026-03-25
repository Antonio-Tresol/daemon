import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindPaginated = vi.fn().mockReturnValue([]);
const mockCountBySessionId = vi.fn().mockReturnValue(0);

vi.mock('@/server/infrastructure/db/event.sqlite-repo', () => ({
  SqliteEventRepository: vi.fn().mockImplementation(function () {
    return {
      findPaginated: mockFindPaginated,
      countBySessionId: mockCountBySessionId,
    };
  }),
}));

import { GET } from './route';

describe('GET /api/agent/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns events for a session', async () => {
    const events = [{ id: 'e1', eventType: 'PostToolUse' }];
    mockFindPaginated.mockReturnValue(events);
    mockCountBySessionId.mockReturnValue(1);

    const req = new NextRequest('http://localhost:3000/api/agent/events?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toEqual(events);
    expect(data._meta.total).toBe(1);
  });

  it('returns 400 when sessionId missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/events');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('sessionId');
  });

  it('passes filters to repo', async () => {
    mockFindPaginated.mockReturnValue([]);
    mockCountBySessionId.mockReturnValue(0);

    const req = new NextRequest(
      'http://localhost:3000/api/agent/events?sessionId=s1&type=PostToolUse&toolName=Read&limit=10',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFindPaginated).toHaveBeenCalledWith({
      sessionId: 's1',
      eventType: 'PostToolUse',
      toolName: 'Read',
      limit: 10,
      offset: 0,
    });
  });

  it('returns 500 on error', async () => {
    mockFindPaginated.mockImplementation(() => {
      throw new Error('DB error');
    });

    const req = new NextRequest('http://localhost:3000/api/agent/events?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
