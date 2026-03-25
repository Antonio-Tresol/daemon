import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'daemon Agent API',
    version: '1.0.0',
    description:
      'Agent-first API for monitoring and analyzing Claude Code sessions. Designed for programmatic consumption by AI agents and CLI tools.',
    docs: '/api/agent/docs',
    schemas: '/api/agent/schemas',
    graphql: '/api/agent/graphql',
    endpoints: [
      {
        method: 'GET',
        path: '/api/agent/sessions',
        description: 'List sessions, optionally filtered by status.',
        params: {
          status: {
            type: 'string',
            required: false,
            enum: ['active', 'completed', 'error'],
            description: 'Filter by session status.',
          },
          limit: {
            type: 'integer',
            required: false,
            default: 50,
            max: 200,
            description: 'Maximum number of sessions to return.',
          },
        },
        returns: 'Session[]',
        curl: "curl http://localhost:3000/api/agent/sessions?status=completed&limit=5",
      },
      {
        method: 'GET',
        path: '/api/agent/timeline',
        description:
          'Get the reconstructed timeline for a session (requires prior timeline analysis).',
        params: {
          sessionId: {
            type: 'string',
            required: true,
            description: 'The session ID.',
          },
          level: {
            type: 'integer',
            required: false,
            default: 0,
            description: 'Analysis depth level.',
          },
        },
        returns: 'TimelinePlan[]',
        curl: "curl 'http://localhost:3000/api/agent/timeline?sessionId=SESSION_ID'",
      },
      {
        method: 'GET',
        path: '/api/agent/failures',
        description:
          'Get detected failures for a session (requires prior failures analysis).',
        params: {
          sessionId: {
            type: 'string',
            required: true,
            description: 'The session ID.',
          },
          impact: {
            type: 'string',
            required: false,
            enum: ['critical', 'warning', 'info'],
            description: 'Filter by impact level.',
          },
          type: {
            type: 'string',
            required: false,
            enum: [
              'tool_failure',
              'api_error',
              'permission_denied',
              'logic_error',
              'timeout',
            ],
            description: 'Filter by failure type.',
          },
        },
        returns: 'Failure[]',
        curl: "curl 'http://localhost:3000/api/agent/failures?sessionId=SESSION_ID&impact=critical'",
      },
      {
        method: 'GET',
        path: '/api/agent/improvements',
        description:
          'Get suggested improvements for a session (requires prior improvements analysis).',
        params: {
          sessionId: {
            type: 'string',
            required: true,
            description: 'The session ID.',
          },
          area: {
            type: 'string',
            required: false,
            enum: [
              'hooks',
              'skills',
              'subagents',
              'tools',
              'context',
              'architecture',
              'legibility',
            ],
            description: 'Filter by improvement area.',
          },
          severity: {
            type: 'string',
            required: false,
            enum: ['high', 'medium', 'low'],
            description: 'Filter by severity.',
          },
        },
        returns: 'Improvement[]',
        curl: "curl 'http://localhost:3000/api/agent/improvements?sessionId=SESSION_ID&severity=high'",
      },
      {
        method: 'GET',
        path: '/api/agent/events',
        description: 'Get raw hook events for a session.',
        params: {
          sessionId: {
            type: 'string',
            required: true,
            description: 'The session ID.',
          },
          type: {
            type: 'string',
            required: false,
            description: 'Filter by event type (e.g., PostToolUse).',
          },
          toolName: {
            type: 'string',
            required: false,
            description: 'Filter by tool name.',
          },
          limit: {
            type: 'integer',
            required: false,
            default: 200,
            max: 500,
            description: 'Maximum number of events to return.',
          },
        },
        returns: 'HookEvent[]',
        curl: "curl 'http://localhost:3000/api/agent/events?sessionId=SESSION_ID&type=PostToolUse'",
      },
      {
        method: 'POST',
        path: '/api/agent/analyze',
        description: 'Trigger an analysis job for a session.',
        body: {
          sessionId: {
            type: 'string',
            required: true,
            description: 'The session ID to analyze.',
          },
          type: {
            type: 'string',
            required: true,
            enum: ['timeline', 'failures', 'improvements'],
            description: 'Type of analysis to run.',
          },
          level: {
            type: 'integer',
            required: false,
            default: 0,
            description: 'Analysis depth level.',
          },
        },
        returns: 'AnalysisResult',
        curl: `curl -X POST http://localhost:3000/api/agent/analyze -H 'Content-Type: application/json' -d '{"sessionId":"SESSION_ID","type":"timeline"}'`,
      },
      {
        method: 'GET',
        path: '/api/agent/analysis/:id',
        description: 'Poll for analysis result by ID.',
        params: {
          id: {
            type: 'string',
            required: true,
            description: 'The analysis ID (from POST /api/agent/analyze).',
          },
        },
        returns: 'AnalysisResult',
        curl: "curl http://localhost:3000/api/agent/analysis/ANALYSIS_ID",
      },
      {
        method: 'POST',
        path: '/api/agent/analysis/:id/submit',
        description:
          'Submit analysis results. The analysis agent queries events via this API, builds its analysis, and POSTs the structured result here.',
        body: {
          result: {
            type: 'object',
            required: true,
            description:
              'The analysis result — {plans:[...]} for timeline, {failures:[...]} for failures, {improvements:[...]} for improvements.',
          },
          status: {
            type: 'string',
            required: false,
            enum: ['completed', 'failed'],
            default: 'completed',
            description: 'Analysis status.',
          },
          append: {
            type: 'boolean',
            required: false,
            default: false,
            description:
              'If true, merge arrays with existing result instead of replacing. Useful for incremental submission.',
          },
        },
        returns: 'AnalysisResult',
        curl: `curl -X POST http://localhost:3000/api/agent/analysis/ANALYSIS_ID/submit -H 'Content-Type: application/json' -d '{"result":{"plans":[...]}}'`,
      },
      {
        method: 'GET',
        path: '/api/agent/schemas',
        description: 'List all available JSON schema type names.',
        returns: 'SchemaList',
        curl: 'curl http://localhost:3000/api/agent/schemas',
      },
      {
        method: 'GET',
        path: '/api/agent/schemas/:type',
        description: 'Get JSON Schema for a specific type.',
        params: {
          type: {
            type: 'string',
            required: true,
            enum: [
              'Session',
              'TimelinePlan',
              'Task',
              'Failure',
              'Improvement',
              'HookEvent',
              'AnalysisResult',
            ],
            description: 'The type name.',
          },
        },
        returns: 'JSONSchema',
        curl: 'curl http://localhost:3000/api/agent/schemas/Session',
      },
      {
        method: 'GET',
        path: '/api/agent/docs',
        description: 'Full markdown API documentation.',
        returns: 'text/markdown',
        curl: 'curl http://localhost:3000/api/agent/docs',
      },
      {
        method: 'GET|POST',
        path: '/api/agent/graphql',
        description:
          'GraphQL endpoint. Supports queries and mutations for all data types.',
        curl: `curl -X POST http://localhost:3000/api/agent/graphql -H 'Content-Type: application/json' -d '{"query":"{ sessions(limit:3) { id status startTime totalEvents } }"}'`,
      },
    ],
  });
}
