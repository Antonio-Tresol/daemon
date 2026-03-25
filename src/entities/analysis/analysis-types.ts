/**
 * Central registry for analysis types. Single source of truth.
 * Add new analysis types here — all consumers derive from this array.
 */
export const ANALYSIS_TYPES = ['timeline', 'failures', 'improvements'] as const;

export type AnalysisType = (typeof ANALYSIS_TYPES)[number];

export const PROMPT_FILES: Record<AnalysisType, string> = {
  timeline: 'analyze-session.md',
  failures: 'detect-failures.md',
  improvements: 'suggest-improvements.md',
} satisfies Record<AnalysisType, string>;

export function isValidAnalysisType(value: string): value is AnalysisType {
  return (ANALYSIS_TYPES as readonly string[]).includes(value); // widen const tuple to string[] for .includes() compatibility
}
