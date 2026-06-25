# Portfolio Assistant Chatbot — Design Spec

**Date:** 2026-06-24
**Status:** Approved design, pending implementation plan
**Route:** `/chat`

## Summary

Add an AI portfolio assistant at `/chat`. Visitors (recruiters, collaborators) can ask
questions about Joseph's experience, projects, skills, and background. Answers are grounded
in a single curated background document and streamed to the browser in real time.

The backend is stateless and runs entirely on Vercel as a Next.js Edge API Route, using the
Vercel AI SDK + OpenRouter to call a configurable LLM and stream the response via SSE.

## Goals

- A focused, accurate "ask me anything about Joseph" assistant.
- Cheap to run and safe to expose publicly (basic abuse guardrails).
- Stateless, no database, no persistence — minimal infra.
- Styled consistently with the existing portfolio site.

## Non-Goals (YAGNI)

- No authentication or user accounts.
- No persisted conversation history across visits/sessions.
- No RAG / vector database / embeddings (content is a single page; system prompt suffices).
- No durable cross-instance rate limiting (KV/Redis) — left as a future upgrade.
- No regenerate/stop-generation controls.
- No floating chat widget on the main page — dedicated `/chat` page only.

## Architecture

```
Browser  (/chat page, React client component)
   │  POST /api/chat   { messages: [...] }
   ▼
Edge API Route  (src/app/api/chat/route.js, runtime = 'edge')
   1. rate-limit by IP            → 429 if exceeded
   2. validate input              → 400 if malformed/too long
   3. assemble system prompt      ← src/content/assistant-prompt
   4. streamText() → OpenRouter   (model from env, cheap default)
   │  Server-Sent Events stream
   ▼
Browser renders streaming markdown reply  (useChat + react-markdown)
```

**Stateless:** the client holds the conversation and sends the full message list on each
request. The server keeps nothing between requests.

## Components & Files

### New

| File | Purpose |
| --- | --- |
| `src/app/chat/page.jsx` | The `/chat` page. Client component. Message list, input box, send button, streaming indicator, error display. Uses `useChat` from `@ai-sdk/react`. |
| `src/app/api/chat/route.js` | Edge route (`export const runtime = 'edge'`). The only backend. Validates input, rate-limits, builds the system prompt, calls the model, streams the response. |
| `src/content/assistant-prompt.js` | Exports the curated background + behavior rules string used as the system prompt. Single hand-maintained source of truth for what the bot knows. |
| `src/lib/rate-limit.js` | Small in-memory, per-instance IP rate limiter (sliding/fixed window). |
| `.env.example` | Documents required env vars (no secrets). |

### Modified

| File | Change |
| --- | --- |
| `src/components/NavBar.jsx` | Add a "Chat" (or "Ask AI") link. **Must use a real route navigation (Next `<Link href="/chat">`), not the existing same-page anchor/smooth-scroll handler.** The section items stay anchor-based; the chat link is a separate route link. |
| `src/App.css` | Add chat UI styles using existing `index.css` design tokens. |
| `package.json` | Add deps: `ai`, `@ai-sdk/react`, `@openrouter/ai-sdk-provider`, `react-markdown`, `remark-gfm`. |
| `.gitignore` | Add `.env*.local` so the real key is never committed. |

### Environment variables

| Var | Required | Default | Notes |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes | — | Secret. Set in `.env.local` locally and in Vercel project settings. |
| `CHAT_MODEL` | No | `anthropic/claude-3.5-haiku` | OpenRouter model slug. Configurable so the model can be swapped/upgraded without code changes. |

## Data Flow & Guardrails

**Request:** `useChat` POSTs `{ messages }` to `/api/chat`.

**Validation (→ 400 on failure):**
- `messages` is a non-empty array.
- Last message has non-empty text content.
- Each message content length ≤ ~2000 chars.
- Total message count capped (e.g. ≤ 20); oldest beyond the cap are trimmed before the model call.

**Rate limiting (→ 429 on failure):**
- Keyed on client IP from `x-forwarded-for`.
- Default ~15 messages / minute / IP.
- In-memory per edge instance. **Known limitation:** resets on cold start and is not shared
  across instances. Acceptable for the "basic guardrails" tier; documented upgrade path is
  Vercel KV / Upstash Redis.

**System prompt:** curated background document + behavior rules:
- Only answer questions about Joseph and his work.
- Politely redirect unrelated or out-of-scope questions.
- Never invent facts; if something isn't in the background, say so.
- Keep answers concise.

**Model call:**
```js
streamText({
  model: openrouter(process.env.CHAT_MODEL ?? 'anthropic/claude-3.5-haiku'),
  system: systemPrompt,
  messages,
  maxOutputTokens: 1500,
  temperature: 0.4,
})
```
Returned via the AI SDK's streaming response helper (SSE).

**Rendering:** replies rendered with `react-markdown` + `remark-gfm`. Raw HTML is not
rendered (react-markdown default), so LLM output is safe to display.

**Error handling:**
- Missing `OPENROUTER_API_KEY` or upstream failure → friendly error message in the UI.
- No stack traces, internal details, or the API key are ever leaked to the client.

## Testing

- **Route validation:** malformed body, empty message, over-length message, too many messages → correct 400s.
- **Rate limiting:** exceeding the per-minute limit → 429.
- **Happy path:** valid request streams a response (mock the model/provider in tests).
- **Missing key:** absent `OPENROUTER_API_KEY` → graceful error, no crash, no leak.
- **UI smoke:** `/chat` renders, sending a message shows the streamed reply rendered as markdown; error state renders on failure.

## Open Upgrade Paths (future, not now)

- Durable rate limiting via Vercel KV / Upstash.
- Floating chat widget on the main portfolio page.
- Auto-generating the background doc from component content (single source of truth).
- Conversation persistence / shareable transcripts.
