import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindById = vi.fn().mockReturnValue(null);
const mockUpdateName = vi.fn();
const mockUpdateGroup = vi.fn();

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return {
      findById: mockFindById,
      updateName: mockUpdateName,
      updateGroup: mockUpdateGroup,
    };
  }),
}));

import { PATCH } from './route';

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('PATCH /api/agent/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates session name', async () => {
    const session = { id: 's1', name: 'Old' };
    const updated = { id: 's1', name: 'New' };
    mockFindById.mockReturnValueOnce(session).mockReturnValueOnce(updated);

    const req = new NextRequest('http://localhost:3000/api/agent/sessions/s1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New' }),
    });
    const res = await PATCH(req, makeParams('s1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toEqual(updated);
    expect(mockUpdateName).toHaveBeenCalledWith('s1', 'New');
  });

  it('returns 404 when session not found', async () => {
    mockFindById.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/agent/sessions/missing', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await PATCH(req, makeParams('missing'));
    expect(res.status).toBe(404);
  });

  it('returns 400 when no fields', async () => {
    mockFindById.mockReturnValue({ id: 's1' });

    const req = new NextRequest('http://localhost:3000/api/agent/sessions/s1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, makeParams('s1'));
    expect(res.status).toBe(400);
  });
});
