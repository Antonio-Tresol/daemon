# Daemon — Design System v2

## Three Colors. Symbols. Nothing Else.

Daemon uses exactly three colors. Meaning is carried by **symbols, typography, and opacity** — never by color alone. This constraint produces a design that is cohesive, striking, and unmistakably its own.

## Palette

```
VOID     #0a0a0a    — neon black, the deepest background
BONE     #f0ece5    — neon white, warm Anthropic parchment
EMBER    #d4a574    — Claude's warm amber, the only accent
```

Everything else is derived from these three through opacity:

```
Dark theme depths:
  depth-0:   #0a0a0a               — void
  depth-1:   #0a0a0a + bone at 4%  — cards, sidebar (#141210)
  depth-2:   #0a0a0a + bone at 8%  — hover, expanded (#1e1a16)
  depth-3:   #0a0a0a + bone at 12% — modal, popover (#28241e)

Borders:
  border:       bone at 10%  — hairline (#1e1a16)
  border-bright: bone at 18% — focus, emphasis (#2e2820)

Text:
  text-primary:   bone at 90%  — headings, content (#d8d2ca)
  text-secondary: bone at 50%  — labels, timestamps (#807a72)
  text-muted:     bone at 25%  — disabled, metadata (#403c38)

Accent:
  ember            — links, active states, the ONE color
  ember at 15%     — active backgrounds
  ember at 30%     — hover states
```

### Light theme (warm parchment)

```
  depth-0:   #f0ece5               — bone as background
  depth-1:   #f0ece5 - 3%          — (#e8e2da)
  depth-2:   #f0ece5 - 6%          — (#ddd5ca)
  depth-3:   #f0ece5 - 10%         — (#d0c8be)

  border:       void at 8%
  border-bright: void at 15%

  text-primary:   void at 90%
  text-secondary: void at 50%
  text-muted:     void at 25%

  ember stays the same.
```

## Symbols Replace Colors

Status is communicated through symbols, not color:

```
SUCCESS    ✓    (checkmark)
ERROR      ✗    (cross)
WARNING    ◆    (diamond)
INFO       ○    (circle)
ACTIVE     ●    (filled dot, with pulse animation)
PENDING    ◌    (dashed circle)
```

### Phase differentiation (Timeline)

Phases are NOT color-coded. They use **typographic style**:

```
research        — italic
implementation  — bold
scaffolding     — normal weight, CAPS
testing         — underline
debugging       — strikethrough-style (line-through or special treatment)
refinement      — light weight (300)
```

### Severity (Failures/Improvements)

```
CRITICAL   ✗✗   double cross, ember-colored text
WARNING    ◆    diamond
INFO       ○    circle
```

### Area icons (Improvements)

```
hooks          { }
skills         / /
subagents      >>>
tools          ::
context        #
architecture   |||
legibility     ...
```

These are already in the codebase and stay as-is. Mono font, ember-colored.

## Typography

Three fonts, three purposes:

- **Playfair Display** (serif, italic) — page titles, plan names, section headings. The artistic voice.
- **Inter** (sans) — body text, descriptions. The readable voice.
- **JetBrains Mono** (mono) — data, timestamps, IDs, badges, labels. The precise voice.

### Scale
- 9px: metadata (event IDs, fine print)
- 10px: labels, badges, timestamps (UPPERCASE TRACKED)
- 11px: secondary content
- 12px: body text
- 14px: section headings (serif italic)
- 20px: page titles (serif italic)
- 24px: hero text if needed

### Weight hierarchy
- 300 light: refinement phase, tertiary
- 400 regular: body, descriptions
- 500 medium: labels, active nav
- 600 semibold: emphasis within body

## Corners
- Cards: `rounded-lg` (8px)
- Inner elements: `rounded-md` (6px)
- Small elements: `rounded-sm` (4px)

## Animation
- All transitions: 200ms ease
- Pulse (active): opacity 0.4→1→0.4, 2s, on the ● symbol only
- Reveal: opacity 0→1, translateY 4px→0, 200ms
- Flow: stroke-dashoffset on SVG connectors, ember at 30%

## Component Patterns

### Cards
`bg-depth-1 border border rounded-lg`
- Left border 2px ember for categorized items
- No shadows
- Expand reveals `bg-depth-2` content

### Badges
`rounded-md font-mono text-[10px] uppercase tracking-wider`
- Default: `bg-depth-2 text-text-secondary`
- Active/accent: `bg-ember/15 text-ember`
- That's it. Two variants only.

### Status Indicators
Symbol-based, not color-based:
- Active: `● text-ember` with pulse
- Completed: `✓ text-text-secondary`
- Error: `✗ text-text-primary`
- Pending: `◌ text-text-muted`

### Navigation
- Active: `border-l-2 border-ember text-ember`
- Inactive: `text-text-secondary hover:text-text-primary`
- Logo: serif italic "daemon" in ember

### Timeline connectors
- Dashed SVG line, ember at 20%
- Animated stroke-dashoffset

## Anti-Patterns (DO NOT)
- Do NOT use signal-green, signal-red, signal-amber, signal-blue — they are REMOVED
- Do NOT color-code phases — use typography
- Do NOT use more than 3 colors anywhere
- Do NOT add colored dots for severity — use symbols
- Do NOT make badges colorful — they are depth-2 or ember, nothing else

## Agent Implementation Guide

### Division of work

**Agent A — Foundation**: Update globals.css with the 3-color system. Remove all signal-* colors. Replace with void/bone/ember opacity variants. Update light theme.

**Agent B — Shared UI**: Update Card, Badge, StatusIndicator, Sidebar, Header. StatusIndicator becomes symbol-based. Badge reduces to 2 variants. Sidebar uses ember accent.

**Agent C — Timeline**: Remove phase colors. Replace with typographic differentiation. Connectors in ember. Task icons in text-secondary. Status symbols replace colored dots.

**Agent D — Harness + Sessions**: Failures use ✗/◆/○ symbols. Improvements use ember for accent. Remove all signal-* class usage. Area icons stay mono.
