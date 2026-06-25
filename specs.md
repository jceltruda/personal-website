# Animation Technical Specs

## 1. Scroll-Triggered Reveal (Fade-In + Slide-Up)

### JavaScript — `src/components/Reveal.jsx`

```jsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}
```

### CSS — `src/index.css` (lines 98–117)

```css
/* Scroll-triggered reveal */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  will-change: opacity, transform;
}

.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Reduced motion: keep the gentle opacity fade, but drop the vertical movement. */
@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal-visible {
    transform: none;
  }
}
```

### Usage — `src/app/page.jsx`

```jsx
<Reveal><Header /></Reveal>
<Reveal><Experience /></Reveal>
<Reveal><Education /></Reveal>
<Reveal><Projects /></Reveal>
<Reveal><Skills /></Reveal>
```

### Implementation Flow

```
1. Component mounts → ref attaches to wrapper <div>
2. useEffect creates IntersectionObserver:
   - threshold: 0.15 (fires when 15% of element is visible)
   - rootMargin: '0px 0px -10% 0px' (shrinks bottom detection zone by 10%)
3. Element starts with CSS class "reveal":
   - opacity: 0 (invisible)
   - transform: translateY(24px) (shifted 24px below final position)
4. User scrolls → element enters viewport → observer callback fires
5. entry.isIntersecting === true → setVisible(true)
6. React re-renders → className becomes "reveal reveal-visible"
7. CSS transition activates:
   - opacity: 0 → 1 over 0.6s ease-out
   - translateY(24px) → translateY(0) over 0.6s ease-out
8. observer.unobserve(entry.target) → animation never re-triggers
9. Cleanup: observer.disconnect() on unmount
```

### Key Technical Details

| Detail                  | Value / Behavior                                    |
|-------------------------|-----------------------------------------------------|
| React state             | `visible` boolean, default `false`                  |
| Observer threshold      | `0.15` — 15% element visibility required            |
| Observer rootMargin     | `0px 0px -10% 0px` — bottom edge inset by 10%      |
| Initial opacity         | `0`                                                 |
| Initial transform       | `translateY(24px)` — 24px below final position      |
| Final opacity           | `1`                                                 |
| Final transform         | `translateY(0)`                                     |
| Transition timing       | `0.6s ease-out` (both properties)                   |
| Performance hint        | `will-change: opacity, transform`                   |
| One-shot                | Yes — `unobserve` after first intersection          |
| Reduced motion          | `transform: none` on both states; opacity still fades |
| `'use client'`          | Required — uses `useEffect`, `useRef`, `useState`   |

---

## 2. NavBar Smooth Scroll

### JavaScript — `src/components/NavBar.jsx` (lines 35–38)

```jsx
const handleClick = (e, id) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};
```

### Full NavBar Component — `src/components/NavBar.jsx`

```jsx
'use client';
import { useState, useEffect } from 'react';

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
];

export default function NavBar() {
  const [activeSection, setActiveSection] = useState('about');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -85% 0px' }
    );

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {navItems.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={`navbar-link${activeSection === id ? ' navbar-link-active' : ''}`}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
```

### CSS — `src/App.css` (lines 3–43)

```css
/* NavBar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-color);
}

.navbar-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  gap: 0.25rem;
}

.navbar-link {
  padding: 0.75rem 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.navbar-link:hover {
  color: var(--primary-color);
}

.navbar-link-active {
  color: var(--primary-color) !important;
  border-bottom-color: var(--accent-color);
}

section[id] {
  scroll-margin-top: 3rem;
}
```

### Implementation Flow

```
1. NavBar renders 5 anchor links (<a>) for: About, Experience, Education, Projects, Skills
2. Each link has href="#sectionId" and an onClick handler

SMOOTH SCROLL (on click):
3. User clicks a nav link
4. e.preventDefault() stops default anchor jump
5. document.getElementById(id) finds the target <section>
6. .scrollIntoView({ behavior: 'smooth' }) triggers native smooth scroll
7. scroll-margin-top: 3rem on section[id] offsets for the sticky navbar height

ACTIVE SECTION TRACKING (passive):
8. A second IntersectionObserver watches all 5 section elements
9. rootMargin: '-10% 0px -85% 0px' creates a narrow detection band:
   - Top 10% of viewport ignored
   - Bottom 85% of viewport ignored
   - Only ~5% vertical strip in upper area triggers
10. When a section enters this band → setActiveSection(entry.target.id)
11. Active link gets class "navbar-link-active" → accent bottom border + white text
```

### Key Technical Details

| Detail                       | Value / Behavior                                          |
|------------------------------|-----------------------------------------------------------|
| Scroll API                   | `Element.scrollIntoView({ behavior: 'smooth' })`         |
| Scroll offset                | `scroll-margin-top: 3rem` on `section[id]`               |
| Active tracking observer     | `rootMargin: '-10% 0px -85% 0px'`                        |
| Active tracking threshold    | Default (`0`) — any pixel entering the band triggers it   |
| Active class                 | `.navbar-link-active`                                     |
| Active styling               | `color: var(--primary-color) !important`, `border-bottom-color: var(--accent-color)` |
| Link hover transition        | `color 0.2s ease, border-color 0.2s ease`                |
| Navbar position              | `position: sticky; top: 0; z-index: 100`                 |
| Backdrop effect              | `backdrop-filter: blur(8px)`, `background: rgba(26,26,26,0.85)` |
| `'use client'`               | Required — uses `useState`, `useEffect`                   |

---

## 3. Social Icon — Hover Transition

### JSX — `src/components/Header.jsx` (lines 17–27)

```jsx
<div className="header-socials">
  <a href="mailto:jaceltruda@gmail.com" className="social-icon" aria-label="Email">
    <Mail size={18} />
  </a>
  <a href="https://github.com/jceltruda" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub">
    <FaGithub size={18} />
  </a>
  <a href="https://linkedin.com/in/joseph-celtruda/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
    <FaLinkedin size={18} />
  </a>
</div>
```

### CSS — `src/App.css` (lines 96–119)

```css
.header-socials {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 6px;
  border: 1px solid #4a4a4a;
  color: #c8c8c8;
  background-color: var(--bg-color);
  transition: all 0.2s ease;
}

.social-icon:hover {
  background-color: var(--brand-color);
  color: #ffffff;
  border-color: var(--brand-color);
}
```

### Implementation Flow

```
1. Three <a> elements rendered with class "social-icon"
2. Each contains an SVG icon component at 18px size:
   - Mail (from lucide-react)
   - FaGithub (from react-icons/fa)
   - FaLinkedin (from react-icons/fa)

DEFAULT STATE:
3. 36px × 36px square with 6px border-radius
4. Background: var(--bg-color) → #1a1a1a (dark)
5. Border: 1px solid #4a4a4a (subtle gray)
6. Icon color: #c8c8c8 (light gray)

HOVER STATE:
7. User hovers → CSS transition activates over 0.2s ease
8. background-color: var(--bg-color) → var(--brand-color) (#1E5AA8, blue)
9. color: #c8c8c8 → #ffffff (white)
10. border-color: #4a4a4a → var(--brand-color) (#1E5AA8, blue)
11. All three properties animate simultaneously via "transition: all 0.2s ease"

MOUSE LEAVE:
12. Properties transition back to default over 0.2s ease
```

### Key Technical Details

| Detail                | Value / Behavior                                          |
|-----------------------|-----------------------------------------------------------|
| Element               | `<a>` anchor tags (not buttons)                           |
| Container layout      | Flexbox row, `gap: 0.75rem`                               |
| Icon size             | `size={18}` (18×18px SVG)                                 |
| Box size              | `2.25rem × 2.25rem` (36×36px)                             |
| Border radius         | `6px` (slightly rounded square)                           |
| Default background    | `var(--bg-color)` → `#1a1a1a`                             |
| Default border        | `1px solid #4a4a4a`                                       |
| Default icon color    | `#c8c8c8`                                                 |
| Hover background      | `var(--brand-color)` → `#1E5AA8`                          |
| Hover border          | `var(--brand-color)` → `#1E5AA8`                          |
| Hover icon color      | `#ffffff`                                                 |
| Transition            | `all 0.2s ease` (covers bg, color, border simultaneously) |
| Icon libraries        | `lucide-react` (Mail, Globe), `react-icons/fa` (GitHub, LinkedIn) |
| Accessibility         | Each icon has `aria-label` for screen readers              |
| External links        | `target="_blank"` with `rel="noopener noreferrer"`        |

### CSS Variable Resolution

```
--bg-color:    #1a1a1a  (dark background)
--brand-color: #1E5AA8  (blue brand color)
```
