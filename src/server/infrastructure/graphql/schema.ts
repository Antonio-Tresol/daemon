export const typeDefs = /* GraphQL */ `
  """A Claude Code session representing a single CLI invocation."""
  type Session {
    """Unique session identifier."""
    id: String!
    """ISO 8601 timestamp when the session started."""
    startTime: String!
    """ISO 8601 timestamp when the session ended, null if still active."""
    endTime: String
    """Current session status: active, completed, or error."""
    status: String!
    """Working directory where the session was launched."""
    cwd: String
    """Human-readable name for the session, often auto-set from the first timeline plan."""
    name: String
    """Group label for organizing sessions into logical groups."""
    groupLabel: String
    """Total number of hook events captured in this session."""
    totalEvents: Int!
    """Cumulative cost in USD for API calls in this session."""
    totalCostUsd: Float
  }

  """A discrete unit of work within a timeline plan."""
  type Task {
    """Human-readable name describing the task."""
    name: String!
    """Execution status: completed, in_progress, or failed."""
    status: String!
    """IDs of hook events associated with this task."""
    eventIds: [String!]!
    """ISO 8601 timestamp when the task started."""
    startTime: String
    """ISO 8601 timestamp when the task ended."""
    endTime: String
  }

  """A high-level plan phase extracted from session analysis."""
  type TimelinePlan {
    """Name of the plan phase."""
    name: String!
    """Phase category: research, scaffolding, implementation, testing, debugging, refinement, or other."""
    phase: String!
    """Ordered list of tasks within this plan."""
    tasks: [Task!]!
  }

  """Timeline reconstruction for a session, organized into plan phases."""
  type Timeline {
    """The session this timeline belongs to."""
    sessionId: String!
    """Plan phases at the requested analysis level."""
    plans(level: Int = 0): [TimelinePlan!]!
  }

  """A detected failure or error during a session."""
  type Failure {
    """ISO 8601 timestamp when the failure occurred."""
    timestamp: String!
    """Failure category: tool_failure, api_error, permission_denied, logic_error, or timeout."""
    type: String!
    """Human-readable description of what went wrong."""
    description: String!
    """Identified root cause of the failure, if determined."""
    rootCause: String
    """Severity level: CRITICAL, WARNING, or INFO."""
    impact: String!
    """ID of the hook event that triggered this failure."""
    eventId: String
  }

  """A suggested improvement for the Claude Code setup."""
  type Improvement {
    """Area of improvement: hooks, skills, subagents, tools, context, architecture, or legibility."""
    area: String!
    """Description of the problem identified."""
    problem: String!
    """Actionable suggestion to address the problem."""
    suggestion: String!
    """JSON configuration snippet to implement the suggestion, if applicable."""
    config: String
    """Priority level: HIGH, MEDIUM, or LOW."""
    severity: String!
    """Estimated effort to implement: quick-win, moderate, or significant."""
    effort: String
    """Improvement category for grouping related suggestions."""
    category: String
    """Failures that motivated this improvement."""
    failures: [Failure!]
  }

  """Impact severity levels for failures."""
  enum FailureImpact {
    CRITICAL
    WARNING
    INFO
  }

  """Priority levels for improvements."""
  enum ImprovementSeverity {
    HIGH
    MEDIUM
    LOW
  }

  """Areas where improvements can be suggested."""
  enum ImprovementArea {
    HOOKS
    SKILLS
    SUBAGENTS
    TOOLS
    CONTEXT
    ARCHITECTURE
    LEGIBILITY
  }

  """Analysis types that can be triggered."""
  enum AnalysisType {
    TIMELINE
    FAILURES
    IMPROVEMENTS
  }

  """Count of failures grouped by type."""
  type FailureCount {
    """The failure type."""
    type: String!
    """Number of failures of this type."""
    count: Int!
  }

  """Count of failures grouped by impact level."""
  type ImpactCount {
    """The impact level."""
    impact: String!
    """Number of failures at this impact level."""
    count: Int!
  }

  """Aggregated failure statistics for a session."""
  type FailureSummary {
    """Failure counts grouped by type."""
    byType: [FailureCount!]!
    """Failure counts grouped by impact level."""
    byImpact: [ImpactCount!]!
    """Total number of failures."""
    total: Int!
  }

  """Result of a triggered analysis job."""
  type AnalysisResult {
    """Unique analysis identifier."""
    id: String!
    """Session that was analyzed."""
    sessionId: String!
    """Type of analysis: timeline, failures, or improvements."""
    analysisType: String!
    """Current job status: pending, running, completed, or failed."""
    status: String!
    """Analysis depth level (0 = default)."""
    level: Int!
    """ISO 8601 timestamp when the analysis was triggered."""
    triggeredAt: String!
    """ISO 8601 timestamp when the analysis completed."""
    completedAt: String
    """Error message if the analysis failed."""
    error: String
  }

  """A single hook event captured during a Claude Code session."""
  type HookEvent {
    """Unique event identifier."""
    id: String!
    """Session this event belongs to."""
    sessionId: String!
    """ISO 8601 timestamp when the event occurred."""
    timestamp: String!
    """Event type: PreToolUse, PostToolUse, Stop, SessionStart, etc."""
    eventType: String!
    """Name of the tool involved, if applicable."""
    toolName: String
    """Whether the tool invocation succeeded."""
    success: Boolean
    """Duration of the operation in milliseconds."""
    durationMs: Int
    """Prompt identifier associated with this event."""
    promptId: String
  }

  type Query {
    """List sessions, optionally filtered by status. Returns newest first."""
    sessions(
      """Filter by session status: active, completed, or error."""
      status: String
      """Maximum number of sessions to return (default 50, max 200)."""
      limit: Int
    ): [Session!]!

    """Get a single session by ID."""
    session(
      """The session ID to look up."""
      id: String!
    ): Session

    """Get the reconstructed timeline for a session."""
    timeline(
      """The session ID to get the timeline for."""
      sessionId: String!
    ): Timeline!

    """Get detected failures for a session."""
    failures(
      """The session ID to get failures for."""
      sessionId: String!
      """Filter by impact level."""
      impact: FailureImpact
      """Filter by failure type."""
      type: String
    ): [Failure!]!

    """Get suggested improvements for a session."""
    improvements(
      """The session ID to get improvements for."""
      sessionId: String!
      """Filter by improvement area."""
      area: ImprovementArea
      """Filter by severity level."""
      severity: ImprovementSeverity
    ): [Improvement!]!

    """Get raw hook events for a session."""
    events(
      """The session ID to get events for."""
      sessionId: String!
      """Filter by event type."""
      type: String
      """Filter by tool name."""
      toolName: String
    ): [HookEvent!]!

    """Get distinct group labels across all sessions."""
    groups: [String!]!

    """Get aggregated failure statistics for a session."""
    failureSummary(
      """The session ID to summarize failures for."""
      sessionId: String!
    ): FailureSummary!
  }

  type Mutation {
    """Update a session's name and/or group label."""
    updateSession(
      """The session ID to update."""
      id: ID!
      """New human-readable name for the session."""
      name: String
      """New group label for the session."""
      groupLabel: String
    ): Session

    """Trigger an analysis job for a session."""
    analyze(
      """The session ID to analyze."""
      sessionId: String!
      """Type of analysis to run."""
      type: AnalysisType!
      """Analysis depth level (default 0)."""
      level: Int = 0
    ): AnalysisResult!
  }
`;
