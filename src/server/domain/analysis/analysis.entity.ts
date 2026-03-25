/**
 * Central registry for analysis types. Single source of truth.
 * Add new analysis types here — all consumers derive from this array.
 */
export const ANALYSIS_TYPES = ['timeline', 'failures', 'improvements'] as const;

export type AnalysisType = (typeof ANALYSIS_TYPES)[number];

export function isValidAnalysisType(value: string): value is AnalysisType {
  return (ANALYSIS_TYPES as readonly string[]).includes(value); // widen const tuple to string[] for .includes() compatibility
}

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TimelinePlan = {
  name: string;
  phase:
    | 'research'
    | 'scaffolding'
    | 'implementation'
    | 'testing'
    | 'debugging'
    | 'refinement'
    | 'other';
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
  type: 'tool_failure' | 'api_error' | 'permission_denied' | 'logic_error' | 'timeout';
  description: string;
  rootCause: string;
  impact: 'critical' | 'warning' | 'info';
  eventId: string | null;
  evidence: string[];
};

export type ImprovementArea =
  | 'hooks'
  | 'skills'
  | 'subagents'
  | 'tools'
  | 'context'
  | 'architecture'
  | 'legibility';

export type ImprovementCategory =
  | 'feedback-loop'
  | 'enforcement'
  | 'progressive-disclosure'
  | 'parallelization'
  | 'auto-approval'
  | 'validation'
  | 'context-management';

export type Improvement = {
  area: ImprovementArea;
  problem: string;
  suggestion: string;
  config: Record<string, unknown> | null;
  severity: 'high' | 'medium' | 'low';
  category: ImprovementCategory | string;
  effort: string;
  evidence: string[];
};

export type AnalysisResult = {
  id: string;
  sessionId: string;
  analysisType: AnalysisType;
  level: number;
  triggeredAt: string;
  completedAt: string | null;
  status: AnalysisStatus;
  result: {
    plans?: TimelinePlan[];
    failures?: Failure[];
    improvements?: Improvement[];
  } | null;
  error: string | null;
};

/** Factory: create a new pending analysis */
export function createAnalysis(
  id: string,
  sessionId: string,
  analysisType: AnalysisType,
  level: number = 0,
): AnalysisResult {
  return {
    id,
    sessionId,
    analysisType,
    level,
    triggeredAt: new Date().toISOString(),
    completedAt: null,
    status: 'pending',
    result: null,
    error: null,
  };
}

/** Transition: mark analysis as running */
export function markRunning(analysis: AnalysisResult): AnalysisResult {
  return { ...analysis, status: 'running' };
}

/** Transition: mark analysis as completed with result */
export function completeAnalysis(
  analysis: AnalysisResult,
  result: AnalysisResult['result'],
): AnalysisResult {
  return {
    ...analysis,
    status: 'completed',
    completedAt: new Date().toISOString(),
    result,
  };
}

/** Transition: mark analysis as failed with error */
export function failAnalysis(analysis: AnalysisResult, error: string): AnalysisResult {
  return {
    ...analysis,
    status: 'failed',
    completedAt: new Date().toISOString(),
    error,
  };
}
