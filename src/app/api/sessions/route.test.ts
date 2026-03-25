import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindAll = vi.fn().mockReturnValue([]);
const mockFindActive = vi.fn().mockReturnValue([]);
const mockFindByGroup = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return {
      findAll: mockFindAll,
      findActive: mockFindActive,
      findByGroup: mockFindByGroup,
    };
  }),
}));

import { GET } from './route';

describe('GET /api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all sessions with default limit', async () => {
    const sessions = [
      { id: 's1', status: 'completed' },
      { id: 's2', status: 'active' },
    ];
    mockFindAll.mockReturnValue(sessions);

    const req = new NextRequest('http://localhost:3000/api/sessions');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessions).toEqual(sessions);
    expect(mockFindAll).toHaveBeenCalled();
  });

  it('filters by status=active using findActive', async () => {
    const active = [{ id: 's1', status: 'active' }];
    mockFindActive.mockReturnValue(active);

    const req = new NextRequest('http://localhost:3000/api/sessions?status=active');
    const res = await GET(req);
    const data = await res.json();
    expect(data.sessions).toEqual(active);
    expect(mockFindActive).toHaveBeenCalled();
  });

  it('filters by status=completed in memory', async () => {
    const all = [
      { id: 's1', status: 'completed' },
      { id: 's2', status: 'active' },
    ];
    mockFindAll.mockReturnValue(all);

    const req = new NextRequest('http://localhost:3000/api/sessions?status=completed');
    const res = await GET(req);
    const data = await res.json();
    expect(data.sessions).toEqual([{ id: 's1', status: 'completed' }]);
  });

  it('filters by group', async () => {
    const grouped = [{ id: 's1', status: 'active', groupLabel: 'mygroup' }];
    mockFindByGroup.mockReturnValue(grouped);

    const req = new NextRequest('http://localhost:3000/api/sessions?group=mygroup');
    const res = await GET(req);
    const data = await res.json();
    expect(data.sessions).toEqual(grouped);
    expect(mockFindByGroup).toHaveBeenCalledWith('mygroup');
  });

  it('respects limit parameter', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, status: 'completed' }));
    mockFindAll.mockReturnValue(sessions);

    const req = new NextRequest('http://localhost:3000/api/sessions?limit=3');
    const res = await GET(req);
    const data = await res.json();
    expect(data.sessions).toHaveLength(3);
  });

  it('caps limit at 200', async () => {
    const sessions = Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, status: 'completed' }));
    mockFindAll.mockReturnValue(sessions);

    const req = new NextRequest('http://localhost:3000/api/sessions?limit=999');
    const res = await GET(req);
    const data = await res.json();
    expect(data.sessions).toHaveLength(5);
  });

  it('returns 500 on repository error', async () => {
    mockFindAll.mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const req = new NextRequest('http://localhost:3000/api/sessions');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('DB connection failed');
  });
});
