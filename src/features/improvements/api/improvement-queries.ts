import type { AnalysisResult, RawAnalysisResult } from '@/entities/analysis/model';
import { normalizeAnalysis } from '@/entities/analysis/model';

type ImprovementResponse = {
  analyses: RawAnalysisResult[];
};

export async function fetchImprovements(sessionId?: string): Promise<AnalysisResult[]> {
  const params = new URLSearchParams({ type: 'improvements' });
  if (sessionId) params.set('sessionId', sessionId);

  const res = await fetch(`/api/analysis?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch improvements: ${res.status}`);

  const data = (await res.json()) as ImprovementResponse;
  return (data.analyses ?? []).map(normalizeAnalysis);
}
