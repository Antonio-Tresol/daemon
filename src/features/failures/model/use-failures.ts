'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AnalysisResult, Failure } from '@/entities/analysis/model';
import { fetchFailures } from '@/features/failures/api/failure-queries';

type UseFailuresReturn = {
  failures: Failure[];
  analysis: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useFailures(sessionId?: string): UseFailuresReturn {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchFailures(sessionId)
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

  const failures = analysis?.result?.failures ?? [];

  return { failures, analysis, isLoading, error, refetch };
}
