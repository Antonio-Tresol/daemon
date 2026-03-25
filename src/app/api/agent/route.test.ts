import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

describe('GET /api/agent', () => {
  it('returns the API manifest', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('daemon Agent API');
    expect(data.version).toBe('1.0.0');
    expect(data.endpoints).toBeDefined();
    expect(Array.isArray(data.endpoints)).toBe(true);
    expect(data.endpoints.length).toBeGreaterThan(0);
  });

  it('replaces localhost with request origin', async () => {
    const req = new NextRequest('https://myapp.example.com/api/agent');
    const res = await GET(req);
    const text = await res.text();
    expect(text).not.toContain('http://localhost:3000');
    expect(text).toContain('https://myapp.example.com');
  });

  it('includes expected endpoints', async () => {
    const req = new NextRequest('http://localhost:3000/api/agent');
    const res = await GET(req);
    const data = await res.json();
    const paths = data.endpoints.map((e: { path: string }) => e.path);
    expect(paths).toContain('/api/agent/sessions');
    expect(paths).toContain('/api/agent/timeline');
    expect(paths).toContain('/api/agent/failures');
    expect(paths).toContain('/api/agent/improvements');
  });
});
