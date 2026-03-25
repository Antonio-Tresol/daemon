import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockExecute = vi.fn();
const mockFindPaginated = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/event.sqlite-repo', () => ({
  SqliteEventRepository: vi.fn().mockImplementation(function () {
    return { findPaginated: mockFindPaginated };
  }),
}));

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock('@/server/application/ingest-event.use-case', () => ({
  IngestEventUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockExecute };
  }),
}));

import { GET, POST } from './route';

describe('GET /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated events', async () => {
    const events = [{ id: 'e1', sessionId: 's1', eventType: 'PostToolUse' }];
    mockFindPaginated.mockReturnValue(events);

    const req = new NextRequest('http://localhost:3000/api/events?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.events).toEqual(events);
    expect(data.count).toBe(1);
  });

  it('passes filter params to repo', async () => {
    mockFindPaginated.mockReturnValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/events?sessionId=s1&eventType=PostToolUse&limit=10&offset=5',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFindPaginated).toHaveBeenCalledWith({
      sessionId: 's1',
      eventType: 'PostToolUse',
      limit: 10,
      offset: 5,
    });
  });

  it('caps limit at 500', async () => {
    mockFindPaginated.mockReturnValue([]);

    const req = new NextRequest('http://localhost:3000/api/events?limit=9999');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFindPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 500 }),
    );
  });
});

describe('POST /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ingests an event and returns eventId', async () => {
    mockExecute.mockReturnValue({ id: 'evt-123' });

    const req = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      body: JSON.stringify({
        session_id: 's1',
        hook_event_name: 'PostToolUse',
        success: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.eventId).toBe('evt-123');
  });

  it('returns 500 on ingest error', async () => {
    mockExecute.mockImplementation(() => {
      throw new Error('Ingest failed');
    });

    const req = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      body: JSON.stringify({ session_id: 's1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Ingest failed');
  });
});
