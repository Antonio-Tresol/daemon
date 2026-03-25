export type { AnalysisType } from '@/entities/analysis/analysis-types';
import type { AnalysisType } from '@/entities/analysis/analysis-types';

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
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: {
    plans?: TimelinePlan[];
    failures?: Failure[];
    improvements?: Improvement[];
  } | null;
  error: string | null;
};
