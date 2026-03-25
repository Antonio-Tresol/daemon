import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindById = vi.fn().mockReturnValue(null);
const mockUpdateName = vi.fn();
const mockUpdateGroup = vi.fn();
const mockFindBySessionId = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return {
      findById: mockFindById,
      updateName: mockUpdateName,
      updateGroup: mockUpdateGroup,
    };
  }),
}));

vi.mock('@/server/infrastructure/db/event.sqlite-repo', () => ({
  SqliteEventRepository: vi.fn().mockImplementation(function () {
    return {
      findBySessionId: mockFindBySessionId,
    };
  }),
}));

import { GET, PATCH } from './route';

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('GET /api/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns session with events when found', async () => {
    const session = { id: 'test-id', status: 'completed' };
    const events = [{ id: 'e1', sessionId: 'test-id', eventType: 'PostToolUse' }];
    mockFindById.mockReturnValue(session);
    mockFindBySessionId.mockReturnValue(events);

    const req = new NextRequest('http://localhost:3000/api/sessions/test-id');
    const res = await GET(req, makeParams('test-id'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.session).toEqual(session);
    expect(data.events).toEqual(events);
  });

  it('returns 404 when session not found', async () => {
    mockFindById.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/sessions/missing');
    const res = await GET(req, makeParams('missing'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Session not found');
  });
});

describe('PATCH /api/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates session name', async () => {
    const session = { id: 'test-id', name: 'Old Name', status: 'completed' };
    const updated = { ...session, name: 'New Name' };
    mockFindById.mockReturnValueOnce(session).mockReturnValueOnce(updated);

    const req = new NextRequest('http://localhost:3000/api/sessions/test-id', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const res = await PATCH(req, makeParams('test-id'));
    expect(res.status).toBe(200);
    expect(mockUpdateName).toHaveBeenCalledWith('test-id', 'New Name');
  });

  it('updates session group', async () => {
    const session = { id: 'test-id', groupLabel: 'old', status: 'completed' };
    mockFindById.mockReturnValueOnce(session).mockReturnValueOnce({ ...session, groupLabel: 'new' });

    const req = new NextRequest('http://localhost:3000/api/sessions/test-id', {
      method: 'PATCH',
      body: JSON.stringify({ groupLabel: 'new' }),
    });
    const res = await PATCH(req, makeParams('test-id'));
    expect(res.status).toBe(200);
    expect(mockUpdateGroup).toHaveBeenCalledWith('test-id', 'new');
  });

  it('returns 404 when session not found', async () => {
    mockFindById.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/sessions/missing', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await PATCH(req, makeParams('missing'));
    expect(res.status).toBe(404);
  });

  it('returns 400 when no fields provided', async () => {
    mockFindById.mockReturnValue({ id: 'test-id', status: 'completed' });

    const req = new NextRequest('http://localhost:3000/api/sessions/test-id', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, makeParams('test-id'));
    expect(res.status).toBe(400);
  });
});
