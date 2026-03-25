import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockExecute = vi.fn();

vi.mock('@/server/infrastructure/create-claude-runner', () => ({
  createClaudeRunner: vi.fn().mockReturnValue({}),
}));

vi.mock('@/server/application/send-message.use-case', () => ({
  SendMessageUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockExecute };
  }),
}));

import { POST } from './route';

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('POST /api/sessions/[id]/message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a message and returns response', async () => {
    mockExecute.mockResolvedValue({ success: true, response: 'Hello!' });

    const req = new NextRequest('http://localhost:3000/api/sessions/s1/message', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hi there' }),
    });
    const res = await POST(req, makeParams('s1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.response).toBe('Hello!');
  });

  it('returns 400 when message is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sessions/s1/message', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req, makeParams('s1'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Message is required');
  });

  it('returns 400 when message is not a string', async () => {
    const req = new NextRequest('http://localhost:3000/api/sessions/s1/message', {
      method: 'POST',
      body: JSON.stringify({ message: 123 }),
    });
    const res = await POST(req, makeParams('s1'));
    expect(res.status).toBe(400);
  });

  it('returns 500 when runner fails', async () => {
    mockExecute.mockResolvedValue({ success: false, error: 'Runner crashed' });

    const req = new NextRequest('http://localhost:3000/api/sessions/s1/message', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
    });
    const res = await POST(req, makeParams('s1'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Runner crashed');
  });
});
