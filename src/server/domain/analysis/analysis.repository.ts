import type { AnalysisResult, AnalysisType } from './analysis.entity';

export interface AnalysisRepository {
  save(analysis: AnalysisResult): void;
  update(analysis: AnalysisResult): void;
  findById(id: string): AnalysisResult | null;
  findBySessionId(sessionId: string, level?: number): AnalysisResult[];
  findLatestByType(
    sessionId: string,
    analysisType: AnalysisType,
    level?: number,
  ): AnalysisResult | null;
  findBySessionIdAndLevel(
    sessionId: string,
    analysisType: AnalysisType,
    level: number,
  ): AnalysisResult | null;
  findPaginated(criteria: {
    sessionId?: string | null;
    analysisType?: string | null;
    level?: number;
    limit?: number;
    offset?: number;
  }): AnalysisResult[];
}
