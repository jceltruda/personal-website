# Home Page Animations

### 1. Scroll-Triggered Reveal (Fade-In + Slide-Up)

| Property        | Value                                                     |
|-----------------|-----------------------------------------------------------|
| **Type**        | Entrance animation — fade in with vertical slide          |
| **Method**      | CSS transition + JavaScript `IntersectionObserver`        |
| **Trigger**     | Element scrolls into viewport (15% visible, -10% bottom margin) |
| **CSS Classes** | `.reveal` → `.reveal-visible`                             |
| **Properties**  | `opacity: 0 → 1`, `transform: translateY(24px) → translateY(0)` |
| **Duration**    | `0.6s ease-out`                                           |
| **Optimization**| `will-change: opacity, transform`                         |
| **Files**       | `src/components/Reveal.jsx` (JS logic), `src/index.css` lines 98–117 (CSS) |

**How it works:**  
The `Reveal` component wraps each major section (`Header`, `Experience`, `Education`, `Projects`, `Skills`). It uses an `IntersectionObserver` to detect when the element becomes visible, then adds the `.reveal-visible` class to transition from invisible/shifted-down to fully visible/in-place. The observer `unobserve`s after first trigger so the animation only plays once.

**Accessibility:** Respects `prefers-reduced-motion: reduce` — disables the vertical `translateY` movement but keeps the opacity fade.

**Applied to sections:**
- `<Reveal><Header /></Reveal>`
- `<Reveal><Experience /></Reveal>`
- `<Reveal><Education /></Reveal>`
- `<Reveal><Projects /></Reveal>`
- `<Reveal><Skills /></Reveal>`

---

### 2. NavBar Smooth Scroll

| Property        | Value                                                  |
|-----------------|--------------------------------------------------------|
| **Type**        | Scroll behavior animation                              |
| **Method**      | JavaScript `scrollIntoView({ behavior: 'smooth' })`   |
| **Trigger**     | Clicking a nav link                                    |
| **File**        | `src/components/NavBar.jsx` line 37                    |

**How it works:**  
When a nav link is clicked, `e.preventDefault()` stops the default jump, and `scrollIntoView` with `behavior: 'smooth'` provides a native browser-animated scroll to the target section.

---

### 3. Social Icon — Hover Transition

| Property        | Value                                                  |
|-----------------|--------------------------------------------------------|
| **Type**        | Hover state transition                                 |
| **Method**      | CSS `transition`                                       |
| **Trigger**     | `:hover`                                               |
| **CSS Class**   | `.social-icon`                                         |
| **Properties**  | `background-color`, `color`, `border-color` (via `all`)|
| **Duration**    | `0.2s ease`                                            |
| **File**        | `src/App.css` lines 112–119                            |

**How it works:**  
Social icons in the header (Email, GitHub, LinkedIn) transition their background to `--brand-color`, text to the site theme blue, and border to match on hover.

---