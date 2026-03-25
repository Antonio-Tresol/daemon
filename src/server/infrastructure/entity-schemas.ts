/**
 * Reusable JSON Schema building blocks for analysis sub-types.
 * Shared between entity schemas (REST) and structured output schemas (SDK).
 */

export const TaskSchema = {
  type: 'object',
  description: 'A discrete unit of work within a timeline plan.',
  properties: {
    name: {
      type: 'string',
      description: 'Human-readable name describing the task.',
    },
    status: {
      type: 'string',
      enum: ['completed', 'in_progress', 'failed'],
      description: 'Execution status.',
    },
    eventIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'IDs of hook events associated with this task.',
    },
    startTime: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp when the task started.',
    },
    endTime: {
      type: ['string', 'null'],
      format: 'date-time',
      description: 'ISO 8601 timestamp when the task ended.',
    },
  },
  required: ['name', 'status', 'eventIds'],
} as const;

export const TimelinePlanSchema = {
  type: 'object',
  description: 'A high-level plan phase extracted from session timeline analysis.',
  properties: {
    name: { type: 'string', description: 'Name of the plan phase.' },
    phase: {
      type: 'string',
      enum: [
        'research',
        'scaffolding',
        'implementation',
        'testing',
        'debugging',
        'refinement',
        'other',
      ],
      description: 'Phase category.',
    },
    tasks: {
      type: 'array',
      description: 'Ordered list of tasks within this plan.',
      items: TaskSchema,
    },
  },
  required: ['name', 'phase', 'tasks'],
} as const;

export const FailureSchema = {
  type: 'object',
  description: 'A detected failure or error during a session.',
  properties: {
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp when the failure occurred.',
    },
    type: {
      type: 'string',
      enum: ['tool_failure', 'api_error', 'permission_denied', 'logic_error', 'timeout'],
      description: 'Failure category.',
    },
    description: {
      type: 'string',
      description: 'Human-readable description of what went wrong.',
    },
    rootCause: {
      type: 'string',
      description: 'Identified root cause of the failure.',
    },
    impact: {
      type: 'string',
      enum: ['critical', 'warning', 'info'],
      description: 'Severity level.',
    },
    eventId: {
      type: ['string', 'null'],
      description: 'ID of the hook event that triggered this failure.',
    },
    evidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'Supporting event IDs.',
    },
  },
  required: ['timestamp', 'type', 'description', 'rootCause', 'impact'],
} as const;

export const ImprovementSchema = {
  type: 'object',
  description: 'A suggested improvement for the Claude Code setup.',
  properties: {
    area: {
      type: 'string',
      enum: ['hooks', 'skills', 'subagents', 'tools', 'context', 'architecture', 'legibility'],
      description: 'Area of improvement.',
    },
    problem: {
      type: 'string',
      description: 'Description of the problem identified.',
    },
    suggestion: {
      type: 'string',
      description: 'Actionable suggestion to address the problem.',
    },
    config: {
      type: ['object', 'null'],
      description: 'JSON configuration snippet to implement the suggestion, if applicable.',
    },
    severity: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'Priority level.',
    },
    effort: {
      type: 'string',
      description: 'Estimated effort to implement: quick-win, moderate, or significant.',
    },
    category: {
      type: 'string',
      description: 'Improvement category for grouping related suggestions.',
    },
    evidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'Supporting event IDs.',
    },
  },
  required: ['area', 'problem', 'suggestion', 'severity'],
} as const;

/** Individual entity schemas (used by the /api/agent/schemas endpoint) */
export const ENTITY_SCHEMAS: Record<string, object> = {
  Session: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Session',
    description: 'A Claude Code session representing a single CLI invocation.',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique session identifier.' },
      startTime: {
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 timestamp when the session started.',
      },
      endTime: {
        type: ['string', 'null'],
        format: 'date-time',
        description: 'ISO 8601 timestamp when the session ended. Null if still active.',
      },
      status: {
        type: 'string',
        enum: ['active', 'completed', 'error'],
        description: 'Current session status.',
      },
      cwd: {
        type: ['string', 'null'],
        description: 'Working directory where the session was launched.',
      },
      projectHash: {
        type: ['string', 'null'],
        description: 'Hash identifying the project.',
      },
      totalEvents: {
        type: 'integer',
        description: 'Total number of hook events captured.',
      },
      totalCostUsd: {
        type: 'number',
        description: 'Cumulative cost in USD for API calls.',
      },
    },
    required: ['id', 'startTime', 'status', 'totalEvents', 'totalCostUsd'],
  },
  TimelinePlan: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'TimelinePlan',
    ...TimelinePlanSchema,
    definitions: { Task: TaskSchema },
  },
  Task: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Task',
    ...TaskSchema,
  },
  Failure: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Failure',
    ...FailureSchema,
  },
  Improvement: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Improvement',
    ...ImprovementSchema,
  },
  HookEvent: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'HookEvent',
    description: 'A single hook event captured during a Claude Code session.',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique event identifier.' },
      sessionId: {
        type: 'string',
        description: 'Session this event belongs to.',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 timestamp when the event occurred.',
      },
      eventType: {
        type: 'string',
        enum: [
          'PreToolUse',
          'PostToolUse',
          'PostToolUseFailure',
          'Stop',
          'SessionStart',
          'SessionEnd',
          'Notification',
          'SubagentStart',
          'SubagentStop',
          'api_request',
          'api_error',
          'user_prompt',
          'tool_result',
          'tool_decision',
        ],
        description: 'Event type.',
      },
      toolName: {
        type: ['string', 'null'],
        description: 'Name of the tool involved, if applicable.',
      },
      success: {
        type: ['boolean', 'null'],
        description: 'Whether the tool invocation succeeded.',
      },
      durationMs: {
        type: ['integer', 'null'],
        description: 'Duration of the operation in milliseconds.',
      },
      promptId: {
        type: ['string', 'null'],
        description: 'Prompt identifier associated with this event.',
      },
    },
    required: ['id', 'sessionId', 'timestamp', 'eventType'],
  },
  AnalysisResult: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'AnalysisResult',
    description: 'Result of a triggered analysis job.',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique analysis identifier.' },
      sessionId: {
        type: 'string',
        description: 'Session that was analyzed.',
      },
      analysisType: {
        type: 'string',
        enum: ['timeline', 'failures', 'improvements'],
        description: 'Type of analysis.',
      },
      status: {
        type: 'string',
        enum: ['pending', 'running', 'completed', 'failed'],
        description: 'Current job status.',
      },
      level: {
        type: 'integer',
        description: 'Analysis depth level (0 = default).',
      },
      triggeredAt: {
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 timestamp when the analysis was triggered.',
      },
      completedAt: {
        type: ['string', 'null'],
        format: 'date-time',
        description: 'ISO 8601 timestamp when the analysis completed.',
      },
      result: {
        type: ['object', 'null'],
        description: 'Analysis results (plans, failures, or improvements).',
      },
      error: {
        type: ['string', 'null'],
        description: 'Error message if the analysis failed.',
      },
    },
    required: ['id', 'sessionId', 'analysisType', 'status', 'triggeredAt'],
  },
};
