# Portfolio Assistant Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI portfolio assistant at `/chat` that answers questions about Joseph, grounded in a curated background document, streaming replies in real time.

**Architecture:** A dedicated `/chat` React client page calls a stateless Next.js Edge API route (`/api/chat`). The route validates input, rate-limits by IP, injects a system prompt, and uses the Vercel AI SDK + OpenRouter to stream a response back over SSE. Pure logic (validation, rate limiting) lives in small unit-tested modules under `src/lib/`.

**Tech Stack:** Next.js 16 (App Router), React 19, Vercel AI SDK v5 (`ai`, `@ai-sdk/react`), `@openrouter/ai-sdk-provider`, `react-markdown` + `remark-gfm`, Vitest (node env) for unit tests.

## Global Constraints

- **No TypeScript.** Plain JS/JSX only, matching the existing codebase.
- **Vanilla CSS** in `src/App.css` using existing custom properties from `src/index.css`. No CSS Modules / Tailwind.
- **AI SDK v6 API** (installed: `ai@6`, `@ai-sdk/react@3` — verified against `node_modules`). Server uses `streamText` + `convertToModelMessages` from `ai` and returns `result.toUIMessageStreamResponse()` (a method on the streamText result — NOT the standalone `createUIMessageStreamResponse` export; both exist, use the result method). Client uses `useChat` from `@ai-sdk/react` (returns `messages`, `sendMessage`, `status`, `error`) with self-managed input (`sendMessage({ text })`) and `DefaultChatTransport` from `ai`. Messages are `UIMessage`s with a `parts` array. The Task 5/6 code below is already correct for v6 — implement it as written.
- **Edge runtime** for the API route: `export const runtime = 'edge'`.
- **Secrets never committed.** `OPENROUTER_API_KEY` lives only in `.env.local` (gitignored) and Vercel settings.
- **Model is configurable:** `process.env.CHAT_MODEL ?? 'anthropic/claude-3.5-haiku'`.
- **Guardrail values (exact):** max 15 messages / 60s per IP; max 2000 chars per message; max 20 messages per conversation (trim oldest); `maxOutputTokens: 1500`; `temperature: 0.4`.
- **Never leak** the API key, stack traces, or internal errors to the client.
- **Commit** after each task's tests pass.

---

### Task 1: Project setup — dependencies, env, test runner

**Files:**
- Modify: `package.json` (add deps + `test` script)
- Create: `vitest.config.js`
- Create: `.env.example`
- Create: `.env.local` (gitignored, real key — created by hand, not committed)
- Modify: `.gitignore`
- Create: `src/lib/__tests__/sanity.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test` command (Vitest, node environment); installed runtime deps used by later tasks.

- [ ] **Step 1: Install runtime and dev dependencies**

Run:
```bash
npm install ai @ai-sdk/react @openrouter/ai-sdk-provider react-markdown remark-gfm
npm install -D vitest
```

- [ ] **Step 2: Add the `test` script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Update `.gitignore`**

Append these lines to `.gitignore`:
```
# local env
.env*.local
```

- [ ] **Step 5: Create `.env.example`**

```
# OpenRouter API key — get one at https://openrouter.ai/keys
OPENROUTER_API_KEY=

# Optional: OpenRouter model slug (defaults to anthropic/claude-3.5-haiku)
CHAT_MODEL=
```

- [ ] **Step 6: Create `.env.local` with a real key (not committed)**

```
OPENROUTER_API_KEY=sk-or-...your-real-key...
```
Confirm `git status` does NOT list `.env.local`.

- [ ] **Step 7: Write a sanity test at `src/lib/__tests__/sanity.test.js`**

```js
import { describe, it, expect } from 'vitest';

describe('test runner', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 8: Run the test**

Run: `npm test`
Expected: PASS (1 test passing).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.js .env.example .gitignore src/lib/__tests__/sanity.test.js
git commit -m "chore: add chat deps and Vitest setup"
```

---

### Task 2: Chat input validation module

**Files:**
- Create: `src/lib/chat-validation.js`
- Test: `src/lib/chat-validation.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `getMessageText(message)` → `string` — concatenates all `text`-type parts of a `UIMessage`; falls back to `message.content` if `parts` is absent.
  - `MAX_MESSAGE_CHARS = 2000`, `MAX_MESSAGES = 20` (exported constants).
  - `validateChatRequest(body)` → `{ ok: true, messages }` on success (messages trimmed to last `MAX_MESSAGES`), or `{ ok: false, status, error }` on failure (`status` is `400`).

- [ ] **Step 1: Write the failing test at `src/lib/chat-validation.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { getMessageText, validateChatRequest, MAX_MESSAGES } from './chat-validation.js';

const userMsg = (text) => ({ role: 'user', parts: [{ type: 'text', text }] });

describe('getMessageText', () => {
  it('joins text parts', () => {
    const msg = { role: 'user', parts: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] };
    expect(getMessageText(msg)).toBe('ab');
  });

  it('falls back to content when parts missing', () => {
    expect(getMessageText({ role: 'user', content: 'hi' })).toBe('hi');
  });
});

describe('validateChatRequest', () => {
  it('rejects a non-array messages field', () => {
    const r = validateChatRequest({ messages: 'nope' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('rejects an empty messages array', () => {
    const r = validateChatRequest({ messages: [] });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('rejects an empty last message', () => {
    const r = validateChatRequest({ messages: [userMsg('   ')] });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('rejects an over-length message', () => {
    const r = validateChatRequest({ messages: [userMsg('x'.repeat(2001))] });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('accepts a valid request', () => {
    const r = validateChatRequest({ messages: [userMsg('hello')] });
    expect(r.ok).toBe(true);
    expect(r.messages).toHaveLength(1);
  });

  it('trims to the last MAX_MESSAGES messages', () => {
    const many = Array.from({ length: MAX_MESSAGES + 5 }, (_, i) => userMsg(`m${i}`));
    const r = validateChatRequest({ messages: many });
    expect(r.ok).toBe(true);
    expect(r.messages).toHaveLength(MAX_MESSAGES);
    expect(getMessageText(r.messages[0])).toBe('m5');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- chat-validation`
Expected: FAIL (module not found / functions undefined).

- [ ] **Step 3: Implement `src/lib/chat-validation.js`**

```js
export const MAX_MESSAGE_CHARS = 2000;
export const MAX_MESSAGES = 20;

export function getMessageText(message) {
  if (Array.isArray(message?.parts)) {
    return message.parts
      .filter((p) => p?.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text)
      .join('');
  }
  return typeof message?.content === 'string' ? message.content : '';
}

export function validateChatRequest(body) {
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, status: 400, error: 'messages must be a non-empty array' };
  }

  for (const message of messages) {
    if (getMessageText(message).length > MAX_MESSAGE_CHARS) {
      return { ok: false, status: 400, error: 'message too long' };
    }
  }

  const last = messages[messages.length - 1];
  if (getMessageText(last).trim().length === 0) {
    return { ok: false, status: 400, error: 'last message is empty' };
  }

  const trimmed = messages.slice(-MAX_MESSAGES);
  return { ok: true, messages: trimmed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- chat-validation`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat-validation.js src/lib/chat-validation.test.js
git commit -m "feat: add chat request validation"
```

---

### Task 3: In-memory IP rate limiter

**Files:**
- Create: `src/lib/rate-limit.js`
- Test: `src/lib/rate-limit.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `checkRateLimit(key, now = Date.now())` → `{ allowed: boolean, retryAfterSeconds: number }`. Fixed-window counter: `RATE_LIMIT_MAX = 15` requests per `RATE_LIMIT_WINDOW_MS = 60000` per `key`. Module-level `Map` state.
  - `_resetRateLimitStore()` — test-only helper to clear state.

- [ ] **Step 1: Write the failing test at `src/lib/rate-limit.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, _resetRateLimitStore, RATE_LIMIT_MAX } from './rate-limit.js';

beforeEach(() => _resetRateLimitStore());

describe('checkRateLimit', () => {
  it('allows up to the max within a window', () => {
    const now = 1000;
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit('ip-a', now).allowed).toBe(true);
    }
  });

  it('blocks once the max is exceeded in the same window', () => {
    const now = 1000;
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('ip-a', now);
    const result = checkRateLimit('ip-a', now);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('tracks keys independently', () => {
    const now = 1000;
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('ip-a', now);
    expect(checkRateLimit('ip-b', now).allowed).toBe(true);
  });

  it('resets after the window elapses', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('ip-a', 1000);
    expect(checkRateLimit('ip-a', 1000).allowed).toBe(false);
    expect(checkRateLimit('ip-a', 1000 + 60000).allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rate-limit`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/rate-limit.js`**

```js
export const RATE_LIMIT_MAX = 15;
export const RATE_LIMIT_WINDOW_MS = 60000;

const store = new Map(); // key -> { windowStart, count }

export function checkRateLimit(key, now = Date.now()) {
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    store.set(key, { windowStart: now, count: 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count < RATE_LIMIT_MAX) {
    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
  return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
}

export function _resetRateLimitStore() {
  store.clear();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rate-limit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limit.js src/lib/rate-limit.test.js
git commit -m "feat: add in-memory IP rate limiter"
```

---

### Task 4: System prompt content

**Files:**
- Create: `src/content/assistant-prompt.js`
- Test: `src/content/assistant-prompt.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `SYSTEM_PROMPT` (exported string) — behavior rules + curated background facts about Joseph.

- [ ] **Step 1: Write the failing test at `src/content/assistant-prompt.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from './assistant-prompt.js';

describe('SYSTEM_PROMPT', () => {
  it('is a non-trivial string', () => {
    expect(typeof SYSTEM_PROMPT).toBe('string');
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(200);
  });

  it('includes key grounding facts', () => {
    expect(SYSTEM_PROMPT).toContain('Joseph Celtruda');
    expect(SYSTEM_PROMPT).toContain('Rensselaer Polytechnic Institute');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- assistant-prompt`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/content/assistant-prompt.js`**

```js
export const SYSTEM_PROMPT = `You are the AI assistant for Joseph Celtruda's personal portfolio website. Visitors (often recruiters or collaborators) chat with you to learn about Joseph.

## Behavior rules
- Only answer questions about Joseph, his background, experience, projects, skills, and how to contact him.
- If asked something unrelated or outside this scope, politely redirect to topics about Joseph.
- Never invent facts. If the answer is not in the background below, say you don't have that information and suggest contacting Joseph directly.
- Be concise, friendly, and professional. Use markdown (short paragraphs, bullet lists, links) when it helps.

## Background about Joseph

**Who he is:** Joseph Celtruda is a Computer Science student at Rensselaer Polytechnic Institute (RPI) in Troy, NY. He researches sequential recommender systems and AI optimization, and is interested in software engineering and applied AI, with internship experience in AI engineering, full-stack development, and scalable backend systems.

**Contact:**
- Email: jaceltruda@gmail.com
- GitHub: https://github.com/jceltruda
- LinkedIn: https://linkedin.com/in/joseph-celtruda/
- Resume: available at /resume on this site

**Education (both at Rensselaer Polytechnic Institute):**
- M.S. Computer Science, 2026 – Dec 2026, GPA 4.0 / 4.0
- B.S. Computer Science, 2022 – 2025, GPA 3.62 / 4.0

**Work experience:**
- Jahnel Group (Schenectady, NY) — Software Engineer Intern, June 2026 – Present. Full stack engineering.
- TE Connectivity (Winston-Salem, NC) — Software Engineer Intern, May 2025 – Aug 2025. Full stack engineering inside the automotive business unit.
- P1ston (Remote) — AI Engineer Intern (Part-Time), May 2025 – Aug 2025. Prompt and AI engineering for supply chain document processing.
- Hudson River Community Credit Union (Corinth, NY) — Management Information Systems Intern, May 2024 – Aug 2024. Data pipeline automation and geospatial data processing.

**Projects:**
- Rehab Games — turns rehab exercises into fun retro games. Tech: JavaScript, Django, MediaPipe, Gunicorn. Live: https://rehab-games.onrender.com/
- Lung Cancer Detection Using CNN — a CNN for lung cancer detection from CT scans. Tech: Python, PyTorch. Code: https://github.com/jceltruda/CNN-for-Lung-Cancer-Classification
- FinGPT - Transformer Prediction — fine-tuning LLMs for stock market prediction. Tech: Python, PyTorch, Transformers. Code: https://github.com/jceltruda/FinGPT-TransformerPrediction

**Skills:** Python, Java, C++, C, JavaScript, HTML/CSS, R, SQL, REST APIs, PostgreSQL, Docker, AWS, Git, Linux, NodeJS, Bootstrap, Django, PyTorch, LangChain, Transformers, NumPy, Pandas, OpenCV, Matplotlib, Dart, Flutter, LaTeX, Power BI.`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- assistant-prompt`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/assistant-prompt.js src/content/assistant-prompt.test.js
git commit -m "feat: add assistant system prompt"
```

---

### Task 5: Edge API route

**Files:**
- Create: `src/app/api/chat/route.js`
- Test: `src/app/api/chat/route.test.js`

**Interfaces:**
- Consumes: `validateChatRequest` (Task 2), `checkRateLimit`, `_resetRateLimitStore` (Task 3), `SYSTEM_PROMPT` (Task 4).
- Produces: `POST(request)` → `Response`. Behavior: `400` on invalid input, `429` (with `Retry-After` header) when rate-limited, `500` JSON when `OPENROUTER_API_KEY` is missing, otherwise a streamed `toUIMessageStreamResponse()`.

**Note on testing:** the test mocks the `ai` module so no real network/model call happens. The route reads the client IP from the `x-forwarded-for` header.

- [ ] **Step 1: Write the failing test at `src/app/api/chat/route.test.js`**

```js
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
  });

  it('returns 500 when the API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const res = await POST(makeRequest({ messages: [userMsg('hi')] }));
    expect(res.status).toBe(500);
    expect(streamText).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- route`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/app/api/chat/route.js`**

```js
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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      { status: 429, headers: { 'content-type': 'application/json', 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const validation = validateChatRequest(body);
  if (!validation.ok) {
    return json({ error: validation.error }, validation.status);
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
  } catch {
    return json({ error: 'The assistant ran into a problem. Please try again.' }, 500);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- route`
Expected: PASS (all four cases).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.js src/app/api/chat/route.test.js
git commit -m "feat: add streaming chat edge route"
```

---

### Task 6: Chat page UI

**Files:**
- Create: `src/app/chat/page.jsx`
- Modify: `src/App.css` (append chat styles)

**Interfaces:**
- Consumes: the `/api/chat` route (Task 5).
- Produces: the `/chat` page. No exports consumed by other tasks.

**Note on testing:** this is a UI page using `useChat`; it is verified via `npm run build`, `npm run lint`, and a manual smoke test (no automated RTL test — the codebase has no component-test harness, and adding jsdom/RTL is out of scope per the spec).

- [ ] **Step 1: Implement `src/app/chat/page.jsx`**

```jsx
'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMessageText } from '../../lib/chat-validation.js';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <main className="chat-page">
      <h1 className="chat-title">Ask about Joseph</h1>
      <p className="chat-subtitle">
        An AI assistant grounded in Joseph&apos;s background. Ask about his experience,
        projects, or skills.
      </p>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Try: &ldquo;What did Joseph do at TE Connectivity?&rdquo;</p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {getMessageText(message)}
            </ReactMarkdown>
          </div>
        ))}
        {busy && <div className="chat-bubble chat-bubble-assistant chat-typing">…</div>}
        {error && (
          <div className="chat-error">Something went wrong. Please try again.</div>
        )}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          maxLength={2000}
          aria-label="Your message"
        />
        <button className="chat-send" type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Append chat styles to `src/App.css`**

```css
/* ===== Chat page ===== */
.chat-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 6rem 1.25rem 2rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.chat-title { margin-bottom: 0.25rem; }
.chat-subtitle { color: var(--text-muted, #888); margin-bottom: 1.5rem; }
.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.chat-empty { color: var(--text-muted, #888); font-style: italic; }
.chat-bubble {
  padding: 0.625rem 0.9rem;
  border-radius: 0.75rem;
  max-width: 85%;
  line-height: 1.5;
}
.chat-bubble p:first-child { margin-top: 0; }
.chat-bubble p:last-child { margin-bottom: 0; }
.chat-bubble-user {
  align-self: flex-end;
  background: var(--accent, #2563eb);
  color: #fff;
}
.chat-bubble-assistant {
  align-self: flex-start;
  background: var(--card-bg, #1a1a1a);
}
.chat-typing { opacity: 0.6; }
.chat-error { color: #ef4444; font-size: 0.9rem; }
.chat-input-row { display: flex; gap: 0.5rem; position: sticky; bottom: 1rem; }
.chat-input {
  flex: 1;
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  border: 1px solid var(--border, #333);
  background: var(--card-bg, #1a1a1a);
  color: inherit;
  font: inherit;
}
.chat-send {
  padding: 0.7rem 1.1rem;
  border-radius: 0.6rem;
  border: none;
  background: var(--accent, #2563eb);
  color: #fff;
  cursor: pointer;
}
.chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
```

> Note: the `var(--name, fallback)` form uses your existing `index.css` tokens when present and falls back otherwise. After writing, open `src/index.css` and replace fallbacks with the real token names if they differ (e.g. `--color-accent`).

- [ ] **Step 3: Verify lint and build pass**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds; `/chat` and `/api/chat` appear in the route output.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open `http://localhost:3000/chat`, ask "What projects has Joseph built?". Confirm a streamed, markdown-rendered answer appears. Stop a moment to send 16 messages quickly and confirm a rate-limit error surfaces.

- [ ] **Step 5: Commit**

```bash
git add src/app/chat/page.jsx src/App.css
git commit -m "feat: add /chat page UI"
```

---

### Task 7: NavBar link to the chat page

**Files:**
- Modify: `src/components/NavBar.jsx`
- Modify: `src/App.css` (optional: style for the route link)

**Interfaces:**
- Consumes: the `/chat` route (Task 6).
- Produces: a visible nav link to `/chat`.

**Note:** the existing nav items are same-page anchors using a smooth-scroll click handler. The chat link is a real route navigation and MUST use Next's `<Link href="/chat">`, rendered separately from the `navItems.map(...)` anchors — do not route it through `handleClick`.

- [ ] **Step 1: Add the import and the link in `src/components/NavBar.jsx`**

At the top, add:
```jsx
import Link from 'next/link';
```

Inside `<div className="navbar-inner">`, after the `navItems.map(...)` block, add:
```jsx
<Link href="/chat" className="navbar-link navbar-chat-link">
  Ask AI
</Link>
```

- [ ] **Step 2: Verify lint and build pass**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual check**

Run `npm run dev`, load `http://localhost:3000/`, click "Ask AI" in the nav, confirm it navigates to `/chat`.

- [ ] **Step 4: Commit**

```bash
git add src/components/NavBar.jsx src/App.css
git commit -m "feat: add Ask AI nav link to chat page"
```

---

## Self-Review notes

- **Spec coverage:** architecture (Tasks 5/6), `/chat` page (6), Edge route (5), system-prompt grounding (4), rate limiting (3), validation (2), markdown rendering (6), nav link (7), env vars + `.gitignore` (1), testing of validation/rate-limit/route (2/3/5). All spec sections map to a task.
- **Known limitation carried from spec:** rate limiting is in-memory per edge instance (resets on cold start, not shared across instances) — acceptable for the basic tier; KV upgrade left for later.
- **Type consistency:** `getMessageText`, `validateChatRequest` (`{ ok, messages | status, error }`), `checkRateLimit` (`{ allowed, retryAfterSeconds }`), and `SYSTEM_PROMPT` names match across the route, page, and their tests.
