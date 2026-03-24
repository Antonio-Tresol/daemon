import type { AnalysisResult, RawAnalysisResult } from '@/entities/analysis/model';
import { normalizeAnalysis } from '@/entities/analysis/model';

type FailureResponse = {
  analyses: RawAnalysisResult[];
};

export async function fetchFailures(sessionId?: string): Promise<AnalysisResult[]> {
  const params = new URLSearchParams({ type: 'failures' });
  if (sessionId) params.set('sessionId', sessionId);

  const res = await fetch(`/api/analysis?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch failures: ${res.status}`);

  const data = (await res.json()) as FailureResponse;
  return (data.analyses ?? []).map(normalizeAnalysis);
}
