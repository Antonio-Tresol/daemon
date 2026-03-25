import { fetchAnalysis } from '@/entities/analysis/api/fetch-analysis';

export function fetchFailures(sessionId?: string) {
  return fetchAnalysis('failures', sessionId);
}
