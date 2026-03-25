'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AnalysisResult, TimelinePlan } from '@/entities/analysis/model';
import { fetchTimeline } from '@/features/timeline/api/timeline-queries';

type UseTimelineReturn = {
  plans: TimelinePlan[];
  analysis: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  level: number;
  setLevel: (level: number) => void;
  refetch: () => void;
};

export function useTimeline(sessionId?: string, initialLevel = 0): UseTimelineReturn {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(initialLevel);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchTimeline(sessionId, level)
      .then((results) => {
        // Prefer the latest completed analysis with actual plans
        const completed = results.find((r) => r.status === 'completed' && r.result?.plans?.length);
        const latest =
          completed ?? results.find((r) => r.status === 'completed') ?? results[0] ?? null;
        setAnalysis(latest);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setIsLoading(false));
  }, [sessionId, level]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const plans = analysis?.result?.plans ?? [];

  return { plans, analysis, isLoading, error, level, setLevel, refetch };
}
