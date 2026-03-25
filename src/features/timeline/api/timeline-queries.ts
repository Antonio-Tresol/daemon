import { fetchAnalysis } from '@/entities/analysis/api/fetch-analysis';

export function fetchTimeline(sessionId?: string, level = 0) {
  return fetchAnalysis('timeline', sessionId, level);
}
