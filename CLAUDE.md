# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

Single-page portfolio website using Next.js App Router with plain JavaScript (JSX, no TypeScript) and vanilla CSS.

**Routing:** Only one route (`/`). `src/app/layout.jsx` defines the root HTML shell and metadata; `src/app/page.jsx` composes all sections.

**Components** (`src/components/`): Five standalone section components — `Header`, `Experience`, `Education`, `Projects`, `Skills` — each self-contained with no shared state or props. All content (job history, project descriptions, skill tags) is hardcoded inside the component files. Also present: `NavBar` (sticky top nav) and `Reveal` (animation wrapper, see below).

**Styling:** `src/index.css` defines CSS custom properties (colors, spacing, fonts) and resets. `src/App.css` contains all component-level styles. There is no CSS Modules, Tailwind, or other styling system — class names are plain strings scoped by convention.

**Scroll reveal animation:** Sections fade in as they scroll into view. `src/components/Reveal.jsx` is a `'use client'` wrapper that uses `IntersectionObserver` to toggle a `reveal-visible` class on first intersection (then unobserves). `page.jsx` wraps each section in `<Reveal>`. The `.reveal` / `.reveal-visible` CSS lives in `index.css`. Under `prefers-reduced-motion: reduce` the opacity fade is kept but the `translateY` movement is dropped (a plain fade is treated as motion-safe). Note: Windows "Animation effects = off" reports as `prefers-reduced-motion: reduce`, so the slide-up won't show on such machines — this is expected, not a bug.

**Icons:** `lucide-react` for `Mail` and `Globe`; `react-icons` for GitHub (`FaGithub`) and LinkedIn (`FaLinkedin`) icons.

**Static assets** live in `public/`: `headshot-cropped.jpg`, `resume.pdf`, and `logos/` (company/school logo images referenced in Experience and Education components).
