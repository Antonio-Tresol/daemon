import type { AnalysisResult, RawAnalysisResult } from '@/entities/analysis/model';
import { normalizeAnalysis } from '@/entities/analysis/model';

type AnalysisResponse = {
  analyses: RawAnalysisResult[];
};

/**
 * Fetch analyses from /api/analysis with the given type, optional sessionId, and optional level.
 */
export async function fetchAnalysis(
  type: string,
  sessionId?: string,
  level?: number,
): Promise<AnalysisResult[]> {
  const params = new URLSearchParams({ type });
  if (sessionId) params.set('sessionId', sessionId);
  if (level !== undefined) params.set('level', String(level));

  const res = await fetch(`/api/analysis?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type}: ${res.status}`);

  const data = (await res.json()) as AnalysisResponse; // fetch .json() returns unknown
  return (data.analyses ?? []).map(normalizeAnalysis);
}
