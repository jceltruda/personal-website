'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp } from 'lucide-react';
import { getMessageText } from '../../lib/chat-validation.js';

const SUGGESTIONS = [
  'What did Joseph do at TE Connectivity?',
  'What are his strongest skills?',
  'Tell me about a project he built.',
  'What did he study in school?',
];

const STATIC_PLACEHOLDER = 'Ask anything about Joseph…';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

// Types a suggestion out character by character, holds, deletes it, then
// advances to the next — an animated "ghost" prompt living in the input's
// placeholder. Returns the current fragment and the full word it's targeting
// so it can be accepted with Tab/Enter.
function useTypewriter(words, active) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    const word = words[index % words.length];
    const atFull = !deleting && text === word;
    const atEmpty = deleting && text === '';

    // Every transition runs inside the timeout (never synchronously in the
    // effect body): pause when fully typed, advance when fully deleted,
    // otherwise add/remove a character.
    const delay = atFull ? 1800 : atEmpty ? 400 : deleting ? 35 : 55;
    const id = setTimeout(() => {
      if (atFull) {
        setDeleting(true);
      } else if (atEmpty) {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else {
        setText((t) =>
          deleting ? word.slice(0, t.length - 1) : word.slice(0, t.length + 1)
        );
      }
    }, delay);
    return () => clearTimeout(id);
  }, [text, deleting, index, active, words]);

  return { fragment: text, word: words[index % words.length] };
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const reduceMotion = usePrefersReducedMotion();
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';
  const thinking = status === 'submitted';
  const isEmpty = messages.length === 0;

  // Only animate the ghost prompt on the empty landing screen while the field
  // is untouched (and motion is allowed).
  const typing = useTypewriter(
    SUGGESTIONS,
    isEmpty && input === '' && !reduceMotion
  );
  // Ghost-typed suggestions only on the empty landing screen; once the
  // conversation starts, a plain follow-up prompt.
  const placeholder = !isEmpty
    ? 'Ask a follow-up…'
    : reduceMotion
      ? STATIC_PLACEHOLDER
      : `${typing.fragment}▏`;

  const submit = (text) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Empty field + a ghost suggestion showing → accept it instead of sending,
    // so the user can review or edit before a second Enter fires it off.
    if (!input.trim()) {
      if (isEmpty && typing.word) setInput(typing.word);
      return;
    }
    submit(input);
  };

  const handleKeyDown = (e) => {
    // Tab accepts the currently-typed ghost suggestion when the field is empty.
    if (e.key === 'Tab' && !e.shiftKey && input === '' && isEmpty && typing.word) {
      e.preventDefault();
      setInput(typing.word);
    }
  };

  return (
    <main className={`chat-page${isEmpty ? '' : ' chat-page--active'}`}>
      <div className="chat-glow" aria-hidden="true" />

      {isEmpty ? (
        <div className="chat-hero">
          <h1 className="chat-hero-title">
            What do you want to know about Joseph?
          </h1>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`chat-row chat-row-${message.role}`}>
              <div className={`chat-bubble chat-bubble-${message.role}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {getMessageText(message)}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {thinking && (
            <div className="chat-row chat-row-assistant">
              <div
                className="chat-bubble chat-bubble-assistant chat-typing"
                aria-label="Assistant is typing"
              >
                <span className="chat-dot" />
                <span className="chat-dot" />
                <span className="chat-dot" />
              </div>
            </div>
          )}
          {error && (
            <div className="chat-error">Something went wrong. Please try again.</div>
          )}
        </div>
      )}

      <form className="chat-composer" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={2000}
          aria-label="Your message"
        />
        <button
          className="chat-send"
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send message"
        >
          <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </form>

      {isEmpty && input === '' && (
        <p className="chat-hint">
          Press <kbd className="chat-kbd">Tab</kbd> to use the suggested prompt
        </p>
      )}
    </main>
  );
}
