import type { AnalysisResult } from '../domain/analysis/analysis.entity';

/**
 * Parses raw JSON output from Claude into a typed AnalysisResult['result'].
 * Extracts plans, failures, and improvements arrays if present.
 */
export function parseAnalysisResult(jsonString: string): NonNullable<AnalysisResult['result']> {
  // JSON.parse returns unknown — we narrow each field individually below
  const parsed = JSON.parse(jsonString) as Record<string, unknown>;

  const result: NonNullable<AnalysisResult['result']> = {};

  if ('plans' in parsed && Array.isArray(parsed.plans)) {
    // parsed.plans is unknown from JSON.parse; narrowing after Array.isArray check above
    result.plans = parsed.plans as NonNullable<AnalysisResult['result']>['plans'];
  }

  if ('failures' in parsed && Array.isArray(parsed.failures)) {
    // parsed.failures is unknown from JSON.parse; narrowing after Array.isArray check above
    result.failures = parsed.failures as NonNullable<AnalysisResult['result']>['failures'];
  }

  if ('improvements' in parsed && Array.isArray(parsed.improvements)) {
    // parsed.improvements is unknown from JSON.parse; narrowing after Array.isArray check above
    result.improvements = parsed.improvements as NonNullable<
      AnalysisResult['result']
    >['improvements'];
  }

  return result;
}
