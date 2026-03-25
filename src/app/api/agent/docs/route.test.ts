import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

describe('GET /api/agent/docs', () => {
  it('returns markdown documentation', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent/docs');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    const text = await res.text();
    expect(text).toContain('# daemon Agent API');
  });

  it('replaces localhost with request origin', async () => {
    const req = new NextRequest('https://prod.example.com/api/agent/docs');
    const res = await GET(req);
    const text = await res.text();
    expect(text).not.toContain('http://localhost:3000');
    expect(text).toContain('https://prod.example.com');
  });
});
