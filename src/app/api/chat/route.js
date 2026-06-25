import { streamText, convertToModelMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { validateChatRequest } from '../../../lib/chat-validation.js';
import { checkRateLimit } from '../../../lib/rate-limit.js';
import { SYSTEM_PROMPT } from '../../../content/assistant-prompt.js';

export const runtime = 'edge';

const DEFAULT_MODEL = 'anthropic/claude-3.5-haiku';

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request) {
  // Parse JSON body first — malformed requests are rejected for free and
  // must not consume rate-limit budget.
  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error('Failed to parse request JSON:', err);
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const validation = validateChatRequest(body);
  if (!validation.ok) {
    return json({ error: validation.error }, validation.status);
  }

  // x-forwarded-for is client-supplied / best-effort: if absent all requests
  // share one bucket, and it could be varied to spread load — accepted for
  // the basic-guardrails tier.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      { status: 429, headers: { 'content-type': 'application/json', 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return json({ error: 'The assistant is not configured. Please try again later.' }, 500);
  }

  try {
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    const result = streamText({
      model: openrouter(process.env.CHAT_MODEL || DEFAULT_MODEL),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(validation.messages),
      maxOutputTokens: 1500,
      temperature: 0.4,
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('streamText failed:', err);
    return json({ error: 'The assistant ran into a problem. Please try again.' }, 500);
  }
}
