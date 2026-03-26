'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AnalysisResult, Improvement } from '@/entities/analysis/model';
import { fetchImprovements } from '@/features/improvements/api/improvement-queries';

type UseImprovementsReturn = {
  improvements: Improvement[];
  analysis: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useImprovements(sessionId?: string): UseImprovementsReturn {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchImprovements(sessionId)
      .then((results) => {
        const latest = results.find((r) => r.status === 'completed') ?? null;
        setAnalysis(latest);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const improvements = analysis?.result?.improvements ?? [];

  return { improvements, analysis, isLoading, error, refetch };
}
