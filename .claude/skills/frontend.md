---
description: "Build and modify daemon's frontend — enforcing the three-color design system (void/bone/ember), symbol-based status, typographic hierarchy, generative algorithmic art, and FSD architecture boundaries"
---

# Frontend Engineering — Daemon Design System

You are building UI for daemon, a Claude Code observability tool. Daemon's frontend is where **art meets engineering at the frontier** — it's not a dashboard with charts, it's an instrument that feels alive. Every component embodies the design system: **three colors, symbols over color, typography as hierarchy, generative art as identity**. Read `DESIGN.md` at the project root for the full specification before starting work.

## The Three Colors

```
VOID   #0a0a0a   — background, the absence
BONE   #f0ece5   — text, warm parchment
EMBER  #d4a574   — the ONE accent, Claude's warm amber
```

Everything else is derived through **opacity**. Never introduce a fourth color. Never use red/green/yellow/blue for status. All semantic meaning comes from symbols and typography.

### Depth via opacity (dark theme)

```
depth-0: void                    — page background
depth-1: void + bone at 4%       — cards, sidebar
depth-2: void + bone at 8%       — hover, expanded content
depth-3: void + bone at 12%      — modals, popovers
```

### Text hierarchy

```
text-primary:   bone at 90%  — headings, body
text-secondary: bone at 50%  — labels, timestamps
text-muted:     bone at 25%  — disabled, metadata
```

### Accent usage

Ember is used sparingly: active nav borders, links, active status symbols, accent badges, left-border highlights on categorized cards. Never use ember for large backgrounds.

## Status: Symbols, Not Colors

```
SUCCESS    ✓    text-text-secondary
ERROR      ✗    text-text-primary
WARNING    ◆    text-text-secondary
INFO       ○    text-text-muted
ACTIVE     ●    text-ember + pulse-signal animation
PENDING    ◌    text-text-muted
CRITICAL   ✗✗   text-ember
```

When building status indicators, use `StatusIndicator` from `@/shared/ui/StatusIndicator`. Do not create colored dots or traffic-light patterns.

## Typography: Three Fonts, Three Voices

| Font | Role | When to use |
|------|------|-------------|
| **Playfair Display** (serif italic) | Narrative voice | Page titles, plan names, section headings |
| **Inter** (sans) | Functional voice | Body text, descriptions, UI labels |
| **JetBrains Mono** (mono) | Data voice | Timestamps, IDs, badges, event types, metadata |

### Phase differentiation (Timeline) — typographic, NOT color

```
research        — italic
implementation  — bold
scaffolding     — normal weight, UPPERCASE
testing         — underline
debugging       — line-through
refinement      — font-weight 300
```

### Scale

```
9px   metadata (event IDs, fine print)
10px  labels, badges, timestamps (UPPERCASE TRACKED, mono)
11px  secondary content
12px  body text
14px  section headings (serif italic)
20px  page titles (serif italic)
```

## Component Patterns

### Cards
- `bg-depth-1 border border-border rounded-lg`
- Left border 3px ember for categorized items
- No shadows ever
- Expand reveals `bg-depth-2` content with `depth-reveal` animation

### Badges
Only two visual styles exist:
- **Neutral**: `bg-depth-2 text-text-secondary` — for success, info, neutral
- **Accent**: `bg-ember/15 text-ember` — for error, warning, accent

Use `Badge` from `@/shared/ui/Badge`. Mono font, uppercase, tracked.

### Navigation
- Active: `border-l-2 border-l-ember text-ember font-medium`
- Inactive: `border-l-2 border-l-transparent text-text-secondary hover:bg-depth-2`

### Area icons (mono, ember-colored)
```
hooks          { }
skills         / /
subagents      >>>
tools          ::
context        #
architecture   |||
legibility     ...
```

## Generative Algorithmic Art

Daemon's visual identity is built on **generative art** — not stock illustrations, not static SVGs. The UI breathes.

### LatentDivergence (`@/shared/ui/LatentDivergence`)

The signature piece. A canvas-based particle system where neural agents flow in aligned formation, then diverge as latent features shift — a visual metaphor for AI agent behavior under observation.

**How it works:**
- **Agents** (400 default) start flowing along a shared `alignedAngle`, each carrying a hidden `latentAngle` they'll veer toward
- **Saddle points** (3-7, randomly placed) create zones of instability that accelerate divergence
- **Noise field** (`noise2d`) adds organic turbulence to trajectories — smoothed 2D hash noise, not Perlin
- **Latent activation** accumulates per-agent: `sensitivity × saddleInfluence × cascadeMultiplier`. Once `globalDiv > 0.35`, cascade kicks in and divergence accelerates system-wide
- **Color transition**: agents interpolate from **ember** (aligned, coherent) to **bone** (diverged, independent) using smoothstep (`t²(3-2t)`)
- **Trails**: each agent draws a fading trail (30-70 points) with lineWidth and alpha proportional to trail position and remaining lifespan
- **Mouse interaction**: cursor creates a gravitational field — agents spiral toward it (tangential + radial force) and proximity triggers divergence
- **Lifecycle**: agents age out and respawn, creating continuous renewal
- **Soft fade**: each frame overlays `rgba(void, 0.03)` instead of clearing — trails persist as ghostly afterimages

**Two variants:**
- `hero` — full canvas, 400 agents, long trails (30-70pt), used as page backgrounds and hero sections
- `strip` — thin horizontal band, 80 agents, short trails (15pt), half speed — lives in the sidebar footer

**Where it appears:**
- Sidebar footer — ambient `strip` at 60% opacity, the app's living heartbeat
- Setup page — `hero` behind the onboarding flow, with a gradient fade to void
- TrajectoryView — `hero` at 10% opacity as a background texture behind timeline plans

### Texture Effects (CSS)

- **`fracture-bg`**: Diagonal repeating gradient creating subtle grain on failure card backgrounds — makes damage feel material
- **`ocean-fade-in`**: Page load animation, background transitions from pure black to void — the app emerges from darkness

### Design Philosophy for New Art

When creating new generative visualizations:

1. **Only void/bone/ember** — particles, strokes, fills must use the three palette colors at varying opacities. No fourth color, ever.
2. **Vanilla Canvas API** — no p5.js, no Three.js, no heavy dependencies. Keep it lightweight and embeddable.
3. **Seeded randomness** — use deterministic seeded random (`seed * 16807 % 2147483647`) so compositions are reproducible. Math.random() only for runtime variation.
4. **Mouse interaction** — generative pieces should respond to the cursor. The UI is an instrument, not a poster.
5. **Semantic metaphor** — every visualization should mean something about agent behavior: alignment/divergence, flow/interruption, coherence/chaos. Never purely decorative.
6. **Soft fade, not clear** — overlay translucent background each frame. Trails leave ghosts. History is visible.
7. **Lifecycle** — particles should age, die, respawn. Nothing is permanent. This mirrors session/event lifecycles.
8. **Performance budget** — target 60fps. Use `requestAnimationFrame`, clean up on unmount. Reduce agent count in `strip` variant.

## Animations

```css
pulse-signal   — opacity 0.4→1→0.4, 2s ease infinite (active indicators)
depth-reveal   — opacity 0→1, translateY 4→0, 200ms (expanded content)
current-flow   — stroke-dashoffset on SVG connectors (timeline lines)
sonar-sweep    — vertical sweep, 600ms (data refresh)
ocean-fade-in  — background #000→void on page load (the app emerges)
```

All transitions: 200ms ease. No springs, no bounce, no overshoot.

## FSD Architecture Rules

Strict layer isolation — violations break the architecture:

```
src/shared/    → UI primitives, utils, hooks. Imports NOTHING from above.
src/entities/  → Domain models + display. Imports only from shared.
src/features/  → Feature slices. Imports from shared + entities.
src/app/       → Pages. Composes features.
```

- No barrel exports (`index.ts` re-exports). Import directly: `@/shared/ui/Card`, not `@/shared/ui`.
- Server components by default. Only add `'use client'` when you need state, event handlers, or browser APIs.
- Every new component gets a colocated `.test.ts` file.
- Composition over inheritance. Props-based customization (variant, size, depthLevel).

## Before Writing Code

1. Read `DESIGN.md` for the full spec
2. Check existing components in `src/shared/ui/` — reuse before creating
3. Verify your component respects FSD layer boundaries
4. Use CSS custom properties from `globals.css` — never hardcode colors

## Anti-Patterns (DO NOT)

- Do NOT use signal-green, signal-red, signal-amber, signal-blue — they are deprecated aliases
- Do NOT color-code phases — use typography
- Do NOT add colored dots for severity — use symbols
- Do NOT make badges colorful — they are depth-2 or ember, nothing else
- Do NOT use more than 3 colors anywhere
- Do NOT use shadows — depth is communicated through background layering
- Do NOT import from a higher FSD layer (e.g., shared cannot import from features)
- Do NOT create barrel exports
