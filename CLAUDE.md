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

**Components** (`src/components/`): Five standalone section components — `Header`, `Experience`, `Education`, `Projects`, `Skills` — each self-contained with no shared state or props. All content (job history, project descriptions, skill tags) is hardcoded inside the component files.

**Styling:** `src/index.css` defines CSS custom properties (colors, spacing, fonts) and resets. `src/App.css` contains all component-level styles. There is no CSS Modules, Tailwind, or other styling system — class names are plain strings scoped by convention.

**Icons:** `lucide-react` for `Mail` and `Globe`; `react-icons` for GitHub (`FaGithub`) and LinkedIn (`FaLinkedin`) icons.

**Static assets** live in `public/`: `headshot-cropped.jpg`, `resume.pdf`, and `logos/` (company/school logo images referenced in Experience and Education components).
