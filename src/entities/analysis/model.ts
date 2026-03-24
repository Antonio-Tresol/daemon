export type AnalysisType = 'timeline' | 'failures' | 'improvements';

export type TimelinePlan = {
  name: string;
  phase: 'research' | 'implementation' | 'testing' | 'debugging' | 'other';
  tasks: Array<{
    name: string;
    status: 'completed' | 'in_progress' | 'failed';
    eventIds: string[];
    startTime: string;
    endTime: string | null;
  }>;
};

export type Failure = {
  timestamp: string;
  type:
    | 'tool_failure'
    | 'api_error'
    | 'permission_denied'
    | 'logic_error'
    | 'timeout';
  description: string;
  rootCause: string;
  impact: 'critical' | 'warning' | 'info';
  eventId: string | null;
};

export type Improvement = {
  area: 'hooks' | 'permissions' | 'workflow' | 'claude_md' | 'tooling';
  problem: string;
  suggestion: string;
  hookConfig: Record<string, unknown> | null;
  severity: 'high' | 'medium' | 'low';
};

export type AnalysisResult = {
  id: string;
  sessionId: string;
  analysisType: AnalysisType;
  triggeredAt: string;
  completedAt: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: {
    plans?: TimelinePlan[];
    failures?: Failure[];
    improvements?: Improvement[];
  } | null;
  error: string | null;
};

/**
 * Raw analysis row from the API (snake_case DB columns).
 */
export type RawAnalysisResult = {
  id: string;
  session_id: string;
  analysis_type: AnalysisType;
  triggered_at: string;
  completed_at: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: {
    plans?: TimelinePlan[];
    failures?: Failure[];
    improvements?: Improvement[];
  } | null;
  error: string | null;
};

export function normalizeAnalysis(raw: RawAnalysisResult): AnalysisResult {
  return {
    id: raw.id,
    sessionId: raw.session_id,
    analysisType: raw.analysis_type,
    triggeredAt: raw.triggered_at,
    completedAt: raw.completed_at,
    status: raw.status,
    result: raw.result,
    error: raw.error,
  };
}
