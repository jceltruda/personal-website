'use client';

import { useState, useEffect } from 'react';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning!';
  if (h < 18) return 'Good afternoon!';
  return 'Good evening!';
}

const FRIENDLY = ['Welcome!', 'Nice to meet you!', 'Hey there!'];

export default function Greeting() {
  // Render a stable greeting on the server and first client render (so hydration
  // matches), then pick one at random per visit on the client — weighting in the
  // time-of-day line. Local time and randomness are client-only, so both live in
  // the effect; the update is deferred a frame so it isn't a synchronous
  // set-state-in-effect.
  const [text, setText] = useState('Welcome!');

  useEffect(() => {
    const pool = [timeGreeting(), ...FRIENDLY];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const id = requestAnimationFrame(() => setText(pick));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <h1 className="chat-greeting">
      <span className="chat-greeting-text">{text}</span>
    </h1>
  );
}
