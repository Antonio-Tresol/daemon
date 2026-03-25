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

describe('GET /api/agent/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns sessions with _meta', async () => {
    const sessions = [{ id: 's1', status: 'completed' }];
    mockFindAll.mockReturnValue(sessions);

    const req = new NextRequest('http://localhost:3000/api/agent/sessions');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toEqual(sessions);
    expect(data._meta).toBeDefined();
    expect(data._meta.total).toBe(1);
    expect(data._meta.returned).toBe(1);
  });

  it('filters by status=active', async () => {
    mockFindActive.mockReturnValue([{ id: 's1', status: 'active' }]);

    const req = new NextRequest('http://localhost:3000/api/agent/sessions?status=active');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
    expect(mockFindActive).toHaveBeenCalled();
  });

  it('filters by group', async () => {
    mockFindByGroup.mockReturnValue([{ id: 's1', groupLabel: 'test' }]);

    const req = new NextRequest('http://localhost:3000/api/agent/sessions?group=test');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
    expect(mockFindByGroup).toHaveBeenCalledWith('test');
  });

  it('respects limit', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({ id: `s${i}` }));
    mockFindAll.mockReturnValue(sessions);

    const req = new NextRequest('http://localhost:3000/api/agent/sessions?limit=3');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toHaveLength(3);
    expect(data._meta.total).toBe(10);
    expect(data._meta.returned).toBe(3);
  });

  it('returns 500 on error', async () => {
    mockFindAll.mockImplementation(() => {
      throw new Error('DB error');
    });

    const req = new NextRequest('http://localhost:3000/api/agent/sessions');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('DB error');
  });
});
