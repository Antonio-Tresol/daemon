import type { AnalysisResult, RawAnalysisResult } from '@/entities/analysis/model';
import { normalizeAnalysis } from '@/entities/analysis/model';

type TimelineResponse = {
  analyses: RawAnalysisResult[];
};

export async function fetchTimeline(sessionId?: string, level = 0): Promise<AnalysisResult[]> {
  const params = new URLSearchParams({ type: 'timeline', level: String(level) });
  if (sessionId) params.set('sessionId', sessionId);

  const res = await fetch(`/api/analysis?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.status}`);

  const data = (await res.json()) as TimelineResponse;
  return (data.analyses ?? []).map(normalizeAnalysis);
}
