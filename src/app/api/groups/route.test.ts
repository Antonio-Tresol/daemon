import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindGroups = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return { findGroups: mockFindGroups };
  }),
}));

import { GET } from './route';

describe('GET /api/groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns groups array', async () => {
    mockFindGroups.mockReturnValue(['frontend', 'backend']);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.groups).toEqual(['frontend', 'backend']);
  });

  it('returns empty array when no groups', async () => {
    mockFindGroups.mockReturnValue([]);

    const res = await GET();
    const data = await res.json();
    expect(data.groups).toEqual([]);
  });

  it('returns 500 on error', async () => {
    mockFindGroups.mockImplementation(() => {
      throw new Error('DB error');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('DB error');
  });
});
