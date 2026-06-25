import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the AI SDK so no real model call happens.
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: () => new Response('stream', { status: 200 }),
  })),
  convertToModelMessages: vi.fn((m) => m),
}));

// Mock the OpenRouter provider factory.
vi.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: () => (modelId) => ({ modelId }),
}));

import { POST } from './route.js';
import { _resetRateLimitStore } from '../../../lib/rate-limit.js';
import { streamText } from 'ai';

const makeRequest = (body, ip = '1.2.3.4') =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

const userMsg = (text) => ({ role: 'user', parts: [{ type: 'text', text }] });

beforeEach(() => {
  _resetRateLimitStore();
  vi.clearAllMocks();
  process.env.OPENROUTER_API_KEY = 'test-key';
});

describe('POST /api/chat', () => {
  it('returns 400 for an empty messages array', async () => {
    const res = await POST(makeRequest({ messages: [] }));
    expect(res.status).toBe(400);
  });

  it('streams a response for a valid request', async () => {
    const res = await POST(makeRequest({ messages: [userMsg('hi')] }));
    expect(res.status).toBe(200);
    expect(streamText).toHaveBeenCalledOnce();
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    for (let i = 0; i < 15; i++) {
      await POST(makeRequest({ messages: [userMsg('hi')] }, '9.9.9.9'));
    }
    const res = await POST(makeRequest({ messages: [userMsg('hi')] }, '9.9.9.9'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('returns 500 when the API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const res = await POST(makeRequest({ messages: [userMsg('hi')] }));
    expect(res.status).toBe(500);
    expect(streamText).not.toHaveBeenCalled();
  });
});
