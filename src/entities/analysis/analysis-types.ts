/**
 * Re-exports from domain — the canonical source of truth.
 * Frontend code imports from here; the definitions live in the domain layer.
 */
export {
  ANALYSIS_TYPES,
  type AnalysisType,
  isValidAnalysisType,
} from '@/server/domain/analysis/analysis.entity';

import type { AnalysisType } from '@/server/domain/analysis/analysis.entity';

export const PROMPT_FILES: Record<AnalysisType, string> = {
  timeline: 'analyze-session.md',
  failures: 'detect-failures.md',
  improvements: 'suggest-improvements.md',
} satisfies Record<AnalysisType, string>;
