import { describe, it, expect, vi } from 'vitest';

vi.mock('graphql-yoga', () => {
  const mockHandler = vi.fn().mockImplementation(() =>
    new Response(JSON.stringify({ data: {} }), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  return {
    createYoga: vi.fn().mockReturnValue(mockHandler),
    createSchema: vi.fn().mockReturnValue({}),
  };
});

vi.mock('@/server/infrastructure/graphql/resolvers', () => ({
  resolvers: {},
}));

vi.mock('@/server/infrastructure/graphql/schema', () => ({
  typeDefs: 'type Query { hello: String }',
}));

import { GET, POST } from './route';

describe('/api/agent/graphql', () => {
  it('exports GET handler', () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('exports POST handler', () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });
});
