import { fetchAnalysis } from '@/entities/analysis/api/fetch-analysis';

export function fetchImprovements(sessionId?: string) {
  return fetchAnalysis('improvements', sessionId);
}
