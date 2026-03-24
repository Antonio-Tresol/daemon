import type { AnalysisType } from '../domain/analysis/analysis.entity';
import type { AnalysisRepository } from '../domain/analysis/analysis.repository';
import type { EventRepository } from '../domain/event/event.repository';
import type { SessionRepository } from '../domain/session/session.repository';
import { RunAnalysisUseCase } from './run-analysis.use-case';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const ANALYSIS_TYPES: AnalysisType[] = ['timeline', 'failures', 'improvements'];

export class ScheduleAnalysisUseCase {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly runAnalysis: RunAnalysisUseCase;

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly eventRepo: EventRepository,
    private readonly analysisRepo: AnalysisRepository,
  ) {
    this.runAnalysis = new RunAnalysisUseCase(
      this.analysisRepo,
      this.eventRepo,
    );
  }

  start(intervalMs: number = DEFAULT_INTERVAL_MS): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    const activeSessions = this.sessionRepo.findActive();

    for (const session of activeSessions) {
      const currentEventCount = this.eventRepo.countBySessionId(session.id);

      if (currentEventCount <= session.totalEvents) {
        continue; // no new events since last check
      }

      for (const analysisType of ANALYSIS_TYPES) {
        const latest = this.analysisRepo.findLatestByType(
          session.id,
          analysisType,
        );

        // Skip if an analysis is already running
        if (latest && (latest.status === 'pending' || latest.status === 'running')) {
          continue;
        }

        try {
          await this.runAnalysis.execute(session.id, analysisType);
        } catch {
          // Log but don't crash the scheduler
        }
      }
    }
  }
}
