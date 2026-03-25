import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindPaginated = vi.fn().mockReturnValue([]);

vi.mock('@/server/infrastructure/db/analysis.sqlite-repo', () => ({
  SqliteAnalysisRepository: vi.fn().mockImplementation(function () {
    return { findPaginated: mockFindPaginated };
  }),
}));

import { GET } from './route';

describe('GET /api/agent/improvements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns improvements from completed analysis', async () => {
    const improvements = [
      { area: 'hooks', problem: 'No hooks', suggestion: 'Add hooks', config: null, severity: 'high', effort: 'low', category: 'enforcement' },
    ];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { improvements } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/improvements?sessionId=s1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
    expect(data.data[0].area).toBe('hooks');
  });

  it('filters by area', async () => {
    const improvements = [
      { area: 'hooks', problem: 'A', suggestion: 'B', config: null, severity: 'high', effort: 'low', category: 'enforcement' },
      { area: 'tools', problem: 'C', suggestion: 'D', config: null, severity: 'medium', effort: 'high', category: 'validation' },
    ];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { improvements } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/improvements?sessionId=s1&area=hooks');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
    expect(data.data[0].area).toBe('hooks');
  });

  it('filters by severity', async () => {
    const improvements = [
      { area: 'hooks', problem: 'A', suggestion: 'B', config: null, severity: 'high', effort: 'low', category: 'enforcement' },
      { area: 'tools', problem: 'C', suggestion: 'D', config: null, severity: 'low', effort: 'high', category: 'validation' },
    ];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { improvements } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/improvements?sessionId=s1&severity=high');
    const res = await GET(req);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
  });

  it('returns 400 when sessionId missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/improvements');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('stringifies config objects', async () => {
    const improvements = [
      { area: 'hooks', problem: 'A', suggestion: 'B', config: { key: 'val' }, severity: 'high', effort: 'low', category: 'enforcement' },
    ];
    mockFindPaginated.mockReturnValue([
      { status: 'completed', result: { improvements } },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agent/improvements?sessionId=s1');
    const res = await GET(req);
    const data = await res.json();
    expect(typeof data.data[0].config).toBe('string');
    expect(JSON.parse(data.data[0].config)).toEqual({ key: 'val' });
  });
});
