import type { AnalysisResult, AnalysisType } from './analysis.entity';

export interface AnalysisRepository {
  save(analysis: AnalysisResult): void;
  update(analysis: AnalysisResult): void;
  findById(id: string): AnalysisResult | null;
  findBySessionId(sessionId: string): AnalysisResult[];
  findLatestByType(
    sessionId: string,
    analysisType: AnalysisType,
  ): AnalysisResult | null;
}
