import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RunAnalysisUseCase } from './run-analysis.use-case';
import type { AnalysisRepository } from '../domain/analysis/analysis.repository';
import type { EventRepository } from '../domain/event/event.repository';
import type { ClaudeRunnerPort } from '../domain/claude/claude-runner.port';
import { HookEvent } from '../domain/event/event.entity';

vi.mock('uuid', () => ({
  v4: () => 'analysis-uuid-1',
}));

function createMockAnalysisRepo(): AnalysisRepository {
  return {
    save: vi.fn(),
    update: vi.fn(),
    findById: vi.fn().mockReturnValue(null),
    findBySessionId: vi.fn().mockReturnValue([]),
    findLatestByType: vi.fn().mockReturnValue(null),
    findBySessionIdAndLevel: vi.fn().mockReturnValue(null),
    findPaginated: vi.fn().mockReturnValue([]),
  };
}

function createMockEventRepo(): EventRepository {
  return {
    save: vi.fn(),
    findBySessionId: vi.fn().mockReturnValue([]),
    findByTimeRange: vi.fn().mockReturnValue([]),
    findByType: vi.fn().mockReturnValue([]),
    countBySessionId: vi.fn().mockReturnValue(0),
    findPaginated: vi.fn().mockReturnValue([]),
  };
}

function createMockClaudeRunner(): ClaudeRunnerPort {
  return {
    sendMessage: vi.fn(),
    runAnalysis: vi.fn(),
  };
}

describe('RunAnalysisUseCase', () => {
  let analysisRepo: ReturnType<typeof createMockAnalysisRepo>;
  let eventRepo: ReturnType<typeof createMockEventRepo>;
  let claudeRunner: ReturnType<typeof createMockClaudeRunner>;
  let useCase: RunAnalysisUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    analysisRepo = createMockAnalysisRepo();
    eventRepo = createMockEventRepo();
    claudeRunner = createMockClaudeRunner();
    useCase = new RunAnalysisUseCase(analysisRepo, eventRepo, claudeRunner);
  });

  it('saves a pending analysis then marks it running', async () => {
    vi.mocked(claudeRunner.runAnalysis).mockResolvedValue({ plans: [] });
    vi.mocked(eventRepo.findBySessionId).mockReturnValue([]);

    // Capture status at each call to track transitions
    const saveStatuses: string[] = [];
    const updateStatuses: string[] = [];
    vi.mocked(analysisRepo.save).mockImplementation((a) => {
      saveStatuses.push(a.status);
    });
    vi.mocked(analysisRepo.update).mockImplementation((a) => {
      updateStatuses.push(a.status);
    });

    await useCase.execute('sess-1', 'timeline');

    // save is called once with initial pending status
    expect(analysisRepo.save).toHaveBeenCalledOnce();
    expect(saveStatuses[0]).toBe('pending');

    // update is called at least twice: once for running, once for completed
    expect(updateStatuses.length).toBeGreaterThanOrEqual(2);
    expect(updateStatuses[0]).toBe('running');
    expect(updateStatuses[1]).toBe('completed');
  });

  it('fetches events for the session and passes them to claude runner', async () => {
    const mockEvents = [
      new HookEvent('e1', 'sess-1', 'ts1', 'PreToolUse', 'Read', true, 100, null, {}),
      new HookEvent('e2', 'sess-1', 'ts2', 'PostToolUse', 'Read', true, 50, null, {}),
    ];
    vi.mocked(eventRepo.findBySessionId).mockReturnValue(mockEvents);
    vi.mocked(claudeRunner.runAnalysis).mockResolvedValue({ failures: [] });

    await useCase.execute('sess-1', 'failures');

    expect(eventRepo.findBySessionId).toHaveBeenCalledWith('sess-1');
    expect(claudeRunner.runAnalysis).toHaveBeenCalledWith(
      'failures',
      JSON.stringify(mockEvents, null, 2),
    );
  });

  it('marks analysis as completed on success', async () => {
    const mockResult = { improvements: [{ area: 'hooks' as const, problem: 'test', suggestion: 'fix', config: null, severity: 'high' as const, category: 'enforcement', effort: 'quick-win', evidence: [] }] };
    vi.mocked(claudeRunner.runAnalysis).mockResolvedValue(mockResult);

    const result = await useCase.execute('sess-1', 'improvements');

    expect(result.status).toBe('completed');
    expect(result.result).toEqual(mockResult);
    expect(result.completedAt).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it('marks analysis as failed when claude runner throws', async () => {
    vi.mocked(claudeRunner.runAnalysis).mockRejectedValue(new Error('Analysis failed'));

    const result = await useCase.execute('sess-1', 'timeline');

    expect(result.status).toBe('failed');
    expect(result.error).toBe('Analysis failed');
    expect(result.completedAt).toBeTruthy();
    expect(result.result).toBeNull();
  });

  it('handles non-Error thrown values', async () => {
    vi.mocked(claudeRunner.runAnalysis).mockRejectedValue('string error');

    const result = await useCase.execute('sess-1', 'timeline');

    expect(result.status).toBe('failed');
    expect(result.error).toBe('Unknown analysis error');
  });

  it('returns the final analysis object', async () => {
    vi.mocked(claudeRunner.runAnalysis).mockResolvedValue({ plans: [] });

    const result = await useCase.execute('sess-1', 'timeline');

    expect(result.id).toBe('analysis-uuid-1');
    expect(result.sessionId).toBe('sess-1');
    expect(result.analysisType).toBe('timeline');
    expect(result.level).toBe(0);
  });
});
