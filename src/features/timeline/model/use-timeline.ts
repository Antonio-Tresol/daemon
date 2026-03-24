'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AnalysisResult, TimelinePlan } from '@/entities/analysis/model';
import { fetchTimeline } from '@/features/timeline/api/timeline-queries';

type UseTimelineReturn = {
  plans: TimelinePlan[];
  analysis: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useTimeline(sessionId?: string): UseTimelineReturn {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchTimeline(sessionId)
      .then((results) => {
        const latest = results.length > 0 ? results[0] : null;
        setAnalysis(latest ?? null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const plans = analysis?.result?.plans ?? [];

  return { plans, analysis, isLoading, error, refetch };
}
