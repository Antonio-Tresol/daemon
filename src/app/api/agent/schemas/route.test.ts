import { describe, it, expect } from 'vitest';

import { GET } from './route';

describe('GET /api/agent/schemas', () => {
  it('returns list of schema types', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.schemas).toBeDefined();
    expect(Array.isArray(data.schemas)).toBe(true);
    expect(data.schemas.length).toBeGreaterThan(0);
    expect(data.schemas[0]).toHaveProperty('name');
    expect(data.schemas[0]).toHaveProperty('url');
  });

  it('includes expected schema types', async () => {
    const res = await GET();
    const data = await res.json();
    const names = data.schemas.map((s: { name: string }) => s.name);
    expect(names).toContain('Session');
    expect(names).toContain('Failure');
    expect(names).toContain('Improvement');
    expect(names).toContain('TimelinePlan');
  });

  it('includes _meta', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data._meta).toBeDefined();
    expect(data._meta.total).toBe(data.schemas.length);
  });
});
