import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindById = vi.fn().mockReturnValue(null);
const mockSave = vi.fn();
const mockUpdate = vi.fn();
const mockFindBySessionId = vi.fn().mockReturnValue([]);
const mockCountBySessionId = vi.fn().mockReturnValue(0);
const mockFindPaginated = vi.fn().mockReturnValue([]);
const mockFindByTimeRange = vi.fn().mockReturnValue([]);
const mockFindByType = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return { findById: mockFindById };
  }),
}));

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return { save: mockSave, update: mockUpdate, findById: vi.fn() };
  }),
}));

vi.mock('@/server/infrastructure/db/event.sqlite-repo', () => ({
  SqliteEventRepository: vi.fn().mockImplementation(function () {
    return {
      findBySessionId: mockFindBySessionId,
      countBySessionId: mockCountBySessionId,
      findPaginated: mockFindPaginated,
      findByTimeRange: mockFindByTimeRange,
      findByType: mockFindByType,
    };
  }),
}));

vi.mock('@/server/infrastructure/agent-sdk-claude-runner', () => ({
  AgentSdkClaudeRunner: vi.fn().mockImplementation(function () {
    return {
      runAnalysis: vi.fn().mockResolvedValue({ plans: [] }),
    };
  }),
}));

import { POST } from './route';

describe('POST /api/agent/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs analysis and returns result', async () => {
    mockFindById.mockReturnValue({ id: 's1', status: 'completed' });

    const req = new NextRequest('http://localhost:3000/api/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 's1', type: 'timeline' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.sessionId).toBe('s1');
    expect(data.data.analysisType).toBe('timeline');
    expect(data.data.status).toBe('completed');
  });

  it('returns 400 when body missing sessionId', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ type: 'timeline' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when body missing type', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 's1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid analysis type', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 's1', type: 'invalid' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('type must be one of');
  });

  it('returns 404 when session not found', async () => {
    mockFindById.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'missing', type: 'failures' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('passes level parameter through to analysis', async () => {
    mockFindById.mockReturnValue({ id: 's1' });

    const req = new NextRequest('http://localhost:3000/api/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 's1', type: 'timeline', level: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.level).toBe(1);
  });
});
