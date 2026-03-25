import { v4 as uuidv4 } from 'uuid';
import type { AnalysisType, AnalysisResult } from '../domain/analysis/analysis.entity';
import type { AnalysisRepository } from '../domain/analysis/analysis.repository';
import type { EventRepository } from '../domain/event/event.repository';
import type { ClaudeRunnerPort } from '../domain/claude/claude-runner.port';

export class RunAnalysisUseCase {
  constructor(
    private readonly analysisRepo: AnalysisRepository,
    private readonly eventRepo: EventRepository,
    private readonly claudeRunner: ClaudeRunnerPort,
  ) {}

  async execute(
    sessionId: string,
    analysisType: AnalysisType,
  ): Promise<AnalysisResult> {
    const analysisId = uuidv4();
    const now = new Date().toISOString();

    const analysis: AnalysisResult = {
      id: analysisId,
      sessionId,
      analysisType,
      level: 0,
      triggeredAt: now,
      completedAt: null,
      status: 'pending',
      result: null,
      error: null,
    };

    this.analysisRepo.save(analysis);

    analysis.status = 'running';
    this.analysisRepo.update(analysis);

    try {
      const events = this.eventRepo.findBySessionId(sessionId);
      const sessionData = JSON.stringify(events, null, 2);

      const result = await this.claudeRunner.runAnalysis(analysisType, sessionData);

      analysis.status = 'completed';
      analysis.completedAt = new Date().toISOString();
      analysis.result = result;
      this.analysisRepo.update(analysis);
    } catch (err: unknown) {
      analysis.status = 'failed';
      analysis.completedAt = new Date().toISOString();
      analysis.error =
        err instanceof Error ? err.message : 'Unknown analysis error';
      this.analysisRepo.update(analysis);
    }

    return analysis;
  }
}
