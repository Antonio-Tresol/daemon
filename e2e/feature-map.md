# Daemon — E2E Feature Map

## Pages

### 1. Dashboard (`/`)
- [ ] Page loads with Timeline heading
- [ ] Sidebar shows 4 nav links: Timeline, Harness, Sessions, Setup
- [ ] Sidebar shows current session indicator (ID, status, events)
- [ ] Sidebar footer has theme toggle button
- [ ] Sidebar footer has LatentDivergence strip animation
- [ ] Session selector dropdown populates with available sessions
- [ ] Selecting a session loads its timeline data
- [ ] Analyze button appears when session is selected
- [ ] Events captured counter displays correctly

### 2. Sessions (`/sessions`)
- [ ] Page loads with Sessions heading
- [ ] Filter buttons render: All, Active, Completed
- [ ] Session cards display: ID, status badge, timestamp, events, cost, cwd
- [ ] Clicking Active filter shows only active sessions
- [ ] Clicking Completed filter shows only completed sessions
- [ ] Clicking a session card navigates to `/session/[id]`

### 3. Session Detail (`/session/[id]`)
- [ ] Page loads with session ID in heading and breadcrumbs
- [ ] 5 tabs render: Overview, Timeline, Failures, Improvements, Console
- [ ] Analyze button present in tab bar

#### Overview Tab
- [ ] Metadata panel shows: Status, Duration, Events, Cost
- [ ] Start/End timestamps display
- [ ] Recent events list populates (up to 20 events)

#### Timeline Tab
- [ ] Renders TimelineView with matryoshka depth selector
- [ ] Plans and tasks display if analysis exists

#### Failures Tab
- [ ] Renders FailureTimeline
- [ ] Shows failure cards if analysis exists

#### Improvements Tab
- [ ] Renders ImprovementsList
- [ ] Shows improvement cards if analysis exists

#### Console Tab
- [ ] Mac-style window header with session ID
- [ ] Empty state message: "Send a message to this session..."
- [ ] Text input with green `>` prefix
- [ ] Send button (disabled when empty)
- [ ] Typing text enables send button
- [ ] Sending message shows user message in list
- [ ] Response appears as assistant message

### 4. Harness/Improvements (`/improvements`)
- [ ] Page loads with "Harness Engineering" heading
- [ ] Breadcrumb: Timeline / Harness
- [ ] Session selector dropdown with sessions
- [ ] Group filter dropdown
- [ ] Editable session name (click to rename)
- [ ] Analyze button present
- [ ] Tab bar: Failures, Improvements

#### Failures Tab
- [ ] Analysis badge shows status
- [ ] Impact filter buttons: All, critical (XX), warning (diamond), info (circle)
- [ ] Failure cards with type icon, description, impact badge, timestamp
- [ ] Expanding a card shows root cause and evidence
- [ ] Filtering by impact shows only matching failures

#### Improvements Tab
- [ ] Summary row: total count, severity counts (high/med/low), quick win badge
- [ ] View mode toggle: Priority | Category
- [ ] Area filter pills with icons: `{ }` hooks, `/ /` skills, `>>>` subagents, `::` tools, `#` context, `|||` architecture, `...` legibility
- [ ] Priority view sorts by severity x effort score
- [ ] Category view groups by improvement area
- [ ] ImprovementCard expands to show problem, evidence, config JSON
- [ ] Quick win cards highlighted

### 5. Timeline (`/timeline`)
- [ ] Session selector dropdown
- [ ] Group filter
- [ ] Editable session name
- [ ] Analyze button
- [ ] Events captured counter

#### TimelineView
- [ ] Matryoshka depth selector: Events (level 0), Phases (level 1), Narrative (level 2)
- [ ] Active level highlighted with ember
- [ ] Analysis status badge (completed/pending/running)
- [ ] View mode toggle: List | Trajectory

##### Events Level (0)
- [ ] Plans display with name, phase, task count
- [ ] Phase badges use typographic styles (italic, bold, uppercase, underline, line-through, light)
- [ ] Tasks show status symbol (checkmark/cross/dot), name, icon
- [ ] Expanding a plan reveals its tasks

##### Phases Level (1)
- [ ] If no data: "This depth level hasn't been charted yet."
- [ ] "Open Phases" button triggers `POST /api/agent/analyze` with level=1
- [ ] After analysis: phases display

##### Narrative Level (2)
- [ ] If no data: "This depth level hasn't been charted yet."
- [ ] "Open Narrative" button triggers `POST /api/agent/analyze` with level=2
- [ ] After analysis: narrative displays

##### List View
- [ ] Vertical line connector on left
- [ ] Plan groups with expand/collapse
- [ ] Task items inside plans with status symbols and icons

##### Trajectory View
- [ ] Orientation toggle: horizontal (arrows-horizontal) | vertical (arrows-vertical)
- [ ] Stats bar: X completed, Y plans, Z tasks
- [ ] Phase legend with typographic styles
- [ ] Plan cards connected by dashed animated lines
- [ ] LatentDivergence background at 10% opacity

### 6. Setup (`/setup`)
- [ ] Hero LatentDivergence visualization
- [ ] 4 setup instruction steps with code blocks
- [ ] "What Gets Captured" grid: 6 event types
- [ ] Agent API examples section
- [ ] Uninstall section

---

## Analyze Workflow (E2E)

### Trigger Analysis
- [ ] Click Analyze button → state changes to "Analyzing... 0/3"
- [ ] Per-type status dots show: T (running), F (running), I (running)
- [ ] Each type fires `POST /api/agent/analyze` with correct type
- [ ] SDK runs analysis using local auth (subscription or ANTHROPIC_API_KEY)
- [ ] Button updates count as each completes: "Analyzing... 1/3", "2/3"
- [ ] All 3 complete → button shows "Done — Re-analyze"
- [ ] Tab content refreshes with new analysis data

### Analysis Results
- [ ] Timeline analysis populates plans in TimelineView
- [ ] Failures analysis populates FailureTimeline with failure cards
- [ ] Improvements analysis populates ImprovementsList with suggestion cards
- [ ] Re-analyze overwrites previous results

### Higher-Level Timeline (Matryoshka)
- [ ] Click "Open Phases" → triggers level 1 analysis
- [ ] After completion, phases data displays
- [ ] Click "Open Narrative" → triggers level 2 analysis
- [ ] After completion, narrative data displays

---

## API Endpoints (E2E)

### Event Ingestion
- [ ] `POST /api/events` — accepts hook event, creates session if needed, returns eventId
- [ ] `GET /api/events` — returns events with pagination (limit, offset)
- [ ] `GET /api/events?sessionId=X` — filters by session

### Sessions
- [ ] `GET /api/sessions` — returns sessions list
- [ ] `GET /api/sessions?status=active` — filters by status
- [ ] `GET /api/sessions/[id]` — returns session with events
- [ ] `PATCH /api/sessions/[id]` — renames session
- [ ] `POST /api/sessions/[id]/message` — sends message via SDK

### Agent API
- [ ] `GET /api/agent` — returns manifest with endpoint list
- [ ] `GET /api/agent/sessions` — returns sessions with `_meta`
- [ ] `GET /api/agent/events?sessionId=X` — returns raw events
- [ ] `GET /api/agent/timeline?sessionId=X` — returns timeline plans
- [ ] `GET /api/agent/failures?sessionId=X` — returns failure list
- [ ] `GET /api/agent/improvements?sessionId=X` — returns improvements
- [ ] `POST /api/agent/analyze` — triggers analysis, runs SDK, returns result
- [ ] `GET /api/agent/analysis/[id]` — polls analysis status
- [ ] `POST /api/agent/analysis/[id]/submit` — external agent submits result
- [ ] `GET /api/agent/schemas` — lists schema type names
- [ ] `GET /api/agent/schemas/[type]` — returns JSON schema
- [ ] `GET /api/agent/docs` — returns markdown API docs
- [ ] `POST /api/agent/graphql` — GraphQL queries work

### Groups
- [ ] `GET /api/groups` — returns list of group labels

### Analysis Fetch
- [ ] `GET /api/analysis?type=timeline&sessionId=X` — returns completed analyses
- [ ] `GET /api/analysis?type=failures&sessionId=X` — returns failure analyses
- [ ] `GET /api/analysis?type=improvements&sessionId=X` — returns improvement analyses

---

## Interactive Features (E2E)

### Theme Toggle
- [ ] Click toggle → switches from dark to light theme
- [ ] Colors change: void bg → bone bg, text inverts
- [ ] Click again → switches back to dark

### Session Rename
- [ ] Click session name → input appears, auto-focused
- [ ] Type new name → press Enter → saves via PATCH
- [ ] Session name updates in dropdown and sidebar
- [ ] Press Escape → cancels edit, reverts to original

### Group Filter
- [ ] Dropdown populates with groups from API
- [ ] Selecting a group filters session list
- [ ] If selected session is no longer in filtered list, auto-selects first
- [ ] Selecting "All Sessions" resets filter

### Failure Card Expand
- [ ] Click failure card → expands with depth-reveal animation
- [ ] Shows root cause in depth-2 background box
- [ ] Shows evidence event IDs as ember badges
- [ ] Click again → collapses

### Improvement Card Expand
- [ ] Click improvement card → expands
- [ ] Shows problem description
- [ ] Shows evidence list
- [ ] Shows config JSON if present
- [ ] "Copy JSON" button copies to clipboard

### Timeline Plan Expand
- [ ] Click plan header in list view → expands to show tasks
- [ ] Each task shows icon, status symbol, name
- [ ] Click again → collapses

---

## Design System Compliance

### Three Colors Only
- [ ] No colors outside void (#0a0a0a), bone (#f0ece5), ember (#d4a574) and their opacities
- [ ] No green-*, red-*, blue-*, yellow-* Tailwind classes
- [ ] Depth layers use bone-over-void opacity (depth-0 through depth-3)

### Symbols Not Colors
- [ ] Success uses `checkmark` symbol, not green dot
- [ ] Error uses `cross` symbol, not red dot
- [ ] Warning uses `diamond` symbol
- [ ] Active uses `filled circle` with pulse animation in ember
- [ ] Pending uses `dashed circle` in muted

### Typography
- [ ] Page titles use Playfair Display serif italic
- [ ] Body text uses Inter sans
- [ ] Data/metadata uses JetBrains Mono
- [ ] Phase badges use typographic differentiation, not color

### Generative Art
- [ ] LatentDivergence renders on setup page (hero variant)
- [ ] LatentDivergence renders in sidebar footer (strip variant)
- [ ] LatentDivergence renders behind trajectory view (hero, 10% opacity)
- [ ] Mouse interaction creates gravitational field on canvas
- [ ] Agents transition ember → bone as they diverge

---

## Error Handling

### Empty States
- [ ] No sessions → "No sessions found"
- [ ] No timeline → "No timeline data available yet"
- [ ] No failures → "No failures detected" with checkmark
- [ ] No improvements → "No suggestions yet" with checkmark
- [ ] Higher level not charted → "This depth level hasn't been charted yet"

### API Errors
- [ ] Invalid sessionId → 400 with helpful suggestion
- [ ] Session not found → 404 with "List sessions at GET /api/agent/sessions"
- [ ] Invalid analysis type → 400 with "Valid types: timeline, failures, improvements"
- [ ] Analysis failed → error stored in analysis record, button shows failed state

### Network/SDK Errors
- [ ] SDK timeout (5 min) → analysis marked as failed with error message
- [ ] Non-JSON response from SDK → parser extracts JSON from mixed text
- [ ] Markdown-wrapped JSON → parser strips fences before parsing
