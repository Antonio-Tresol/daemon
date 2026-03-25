import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindGroups = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return { findGroups: mockFindGroups };
  }),
}));

import { GET } from './route';

describe('GET /api/agent/groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns groups with _meta', async () => {
    mockFindGroups.mockReturnValue(['frontend', 'backend']);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toEqual(['frontend', 'backend']);
    expect(data._meta.total).toBe(2);
  });

  it('returns empty array', async () => {
    mockFindGroups.mockReturnValue([]);

    const res = await GET();
    const data = await res.json();
    expect(data.data).toEqual([]);
    expect(data._meta.total).toBe(0);
  });

  it('returns 500 on error', async () => {
    mockFindGroups.mockImplementation(() => {
      throw new Error('DB error');
    });

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
