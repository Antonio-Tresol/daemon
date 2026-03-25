import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindPaginated = vi.fn().mockReturnValue([]);
const mockFindById = vi.fn().mockReturnValue(null);
const mockSave = vi.fn();
const mockUpdate = vi.fn();
const mockFindBySessionIdAndLevel = vi.fn().mockReturnValue(null);
const mockCountBySessionId = vi.fn().mockReturnValue(10);

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return {
      findPaginated: mockFindPaginated,
      findById: mockFindById,
      save: mockSave,
      update: mockUpdate,
      findBySessionIdAndLevel: mockFindBySessionIdAndLevel,
    };
  }),
}));

vi.mock('@/server/infrastructure/db/event.sqlite-repo', () => ({
  SqliteEventRepository: vi.fn().mockImplementation(function () {
    return {
      countBySessionId: mockCountBySessionId,
      findBySessionId: vi.fn().mockReturnValue([]),
      findPaginated: vi.fn().mockReturnValue([]),
    };
  }),
}));

vi.mock('@/server/infrastructure/db/session.sqlite-repo', () => ({
  SqliteSessionRepository: vi.fn().mockImplementation(function () {
    return {
      findById: vi.fn().mockReturnValue({ id: 's1', status: 'completed' }),
      updateName: vi.fn(),
    };
  }),
}));

vi.mock('@/server/infrastructure/run-agent-analysis', () => ({
  readPromptTemplate: vi.fn().mockResolvedValue('prompt'),
  buildAgentPrompt: vi.fn().mockReturnValue('agent prompt'),
  runClaudeAgent: vi.fn().mockResolvedValue({ structured: { plans: [] }, raw: '' }),
}));

vi.mock('@/server/infrastructure/build-event-summary', () => ({
  buildEventSummary: vi.fn().mockReturnValue('summary'),
}));

vi.mock('@/server/infrastructure/auto-name-session', () => ({
  autoNameSession: vi.fn(),
}));

vi.mock('@/shared/lib/parse-json', () => ({
  extractJson: vi.fn().mockReturnValue(null),
  unwrapRawOutput: vi.fn((v: unknown) => v),
}));

import { GET, POST } from './route';

describe('GET /api/analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated analyses', async () => {
    const rows = [
      { id: 'a1', sessionId: 's1', analysisType: 'timeline', status: 'completed', result: JSON.stringify({ plans: [] }) },
    ];
    mockFindPaginated.mockReturnValue(rows);

    const req = new NextRequest('http://localhost:3000/api/analysis?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.analyses).toBeDefined();
  });

  it('passes type filter', async () => {
    mockFindPaginated.mockReturnValue([]);

    const req = new NextRequest('http://localhost:3000/api/analysis?type=failures');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFindPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ analysisType: 'failures' }),
    );
  });

  it('returns 500 on error', async () => {
    mockFindPaginated.mockImplementation(() => {
      throw new Error('DB error');
    });

    const req = new NextRequest('http://localhost:3000/api/analysis');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockReturnValue({
      id: 'a1',
      status: 'completed',
      result: JSON.stringify({ plans: [] }),
    });
  });

  it('returns 400 for invalid type', async () => {
    const req = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 's1', type: 'invalid' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when sessionId missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify({ type: 'timeline' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
