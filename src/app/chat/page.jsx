'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp } from 'lucide-react';
import { getMessageText } from '../../lib/chat-validation.js';
import Greeting from '../../components/Greeting.jsx';

const SUGGESTIONS = [
  'What did Joseph do at TE Connectivity?',
  'What are his strongest skills?',
  'Tell me about a project he built.',
];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';
  const thinking = status === 'submitted';
  const isEmpty = messages.length === 0;

  const submit = (text) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(input);
  };

  return (
    <main className="chat-page">
      {isEmpty ? (
        <div className="chat-hero">
          <Greeting />
          <p className="chat-hero-sub">
            Ask me anything about Joseph — his experience, projects, or skills.
          </p>
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="chat-suggestion"
                onClick={() => submit(s)}
              >
                {s}
              </button>
            ))}
          </div>
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
          placeholder="Message Joseph's assistant…"
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
    </main>
  );
}
