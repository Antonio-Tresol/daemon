import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngestEventUseCase } from './ingest-event.use-case';
import type { EventRepository } from '../domain/event/event.repository';
import type { SessionRepository } from '../domain/session/session.repository';
import { Session } from '../domain/session/session.entity';
import { HookEvent } from '../domain/event/event.entity';

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

function createMockEventRepo(): EventRepository {
  return {
    save: vi.fn(),
    findBySessionId: vi.fn().mockReturnValue([]),
    findByTimeRange: vi.fn().mockReturnValue([]),
    findByType: vi.fn().mockReturnValue([]),
    countBySessionId: vi.fn().mockReturnValue(5),
    findPaginated: vi.fn().mockReturnValue([]),
  };
}

function createMockSessionRepo(): SessionRepository {
  return {
    save: vi.fn(),
    update: vi.fn(),
    findById: vi.fn().mockReturnValue(null),
    findAll: vi.fn().mockReturnValue([]),
    findActive: vi.fn().mockReturnValue([]),
    updateName: vi.fn(),
    updateGroup: vi.fn(),
    findByGroup: vi.fn().mockReturnValue([]),
    findGroups: vi.fn().mockReturnValue([]),
  };
}

describe('IngestEventUseCase', () => {
  let eventRepo: ReturnType<typeof createMockEventRepo>;
  let sessionRepo: ReturnType<typeof createMockSessionRepo>;
  let useCase: IngestEventUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    eventRepo = createMockEventRepo();
    sessionRepo = createMockSessionRepo();
    useCase = new IngestEventUseCase(eventRepo, sessionRepo);
  });

  it('creates a HookEvent and saves it to the event repo', () => {
    const result = useCase.execute({
      sessionId: 'sess-1',
      eventType: 'PreToolUse',
      timestamp: '2025-01-01T00:00:00Z',
      toolName: 'Read',
      success: true,
      durationMs: 100,
      payload: { cost_usd: 0.01 },
    });

    expect(result).toBeInstanceOf(HookEvent);
    expect(result.id).toBe('mock-uuid-1234');
    expect(result.sessionId).toBe('sess-1');
    expect(result.eventType).toBe('PreToolUse');
    expect(eventRepo.save).toHaveBeenCalledOnce();
    expect(eventRepo.save).toHaveBeenCalledWith(result);
  });

  it('creates a new session when none exists', () => {
    vi.mocked(sessionRepo.findById).mockReturnValue(null);

    useCase.execute({
      sessionId: 'sess-new',
      eventType: 'SessionStart',
      timestamp: '2025-01-01T00:00:00Z',
      cwd: '/project',
    });

    expect(sessionRepo.save).toHaveBeenCalledOnce();
    const savedSession = vi.mocked(sessionRepo.save).mock.calls[0][0];
    expect(savedSession).toBeInstanceOf(Session);
    expect(savedSession.id).toBe('sess-new');
    expect(savedSession.cwd).toBe('/project');
    expect(savedSession.status).toBe('active');
  });

  it('updates existing session when it already exists', () => {
    const existingSession = Session.create('sess-1', '2025-01-01T00:00:00Z', '/old');
    vi.mocked(sessionRepo.findById).mockReturnValue(existingSession);
    vi.mocked(eventRepo.countBySessionId).mockReturnValue(10);

    useCase.execute({
      sessionId: 'sess-1',
      eventType: 'PostToolUse',
      timestamp: '2025-01-01T01:00:00Z',
      payload: { cost_usd: 0.05 },
    });

    expect(sessionRepo.save).not.toHaveBeenCalled();
    expect(sessionRepo.update).toHaveBeenCalledOnce();
    expect(existingSession.totalEvents).toBe(10);
    expect(existingSession.totalCostUsd).toBeCloseTo(0.05);
  });

  it('sets cwd on existing session if cwd provided and session has none', () => {
    const existingSession = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
    vi.mocked(sessionRepo.findById).mockReturnValue(existingSession);

    useCase.execute({
      sessionId: 'sess-1',
      eventType: 'PreToolUse',
      cwd: '/new/cwd',
    });

    expect(existingSession.cwd).toBe('/new/cwd');
    expect(sessionRepo.update).toHaveBeenCalledOnce();
  });

  it('does not overwrite existing cwd on session', () => {
    const existingSession = Session.create('sess-1', '2025-01-01T00:00:00Z', '/existing');
    vi.mocked(sessionRepo.findById).mockReturnValue(existingSession);

    useCase.execute({
      sessionId: 'sess-1',
      eventType: 'PreToolUse',
      cwd: '/new/cwd',
    });

    expect(existingSession.cwd).toBe('/existing');
  });

  it('normalizes event type through createHookEvent', () => {
    const result = useCase.execute({
      sessionId: 'sess-1',
      eventType: 'unknown_error_type',
    });

    expect(result.eventType).toBe('api_error');
  });

  it('defaults timestamp when not provided', () => {
    const result = useCase.execute({
      sessionId: 'sess-1',
      eventType: 'PreToolUse',
    });

    // Should have a valid ISO timestamp
    expect(result.timestamp).toBeTruthy();
    expect(() => new Date(result.timestamp)).not.toThrow();
  });

  it('handles SessionEnd event marking session completed', () => {
    const existingSession = Session.create('sess-1', '2025-01-01T00:00:00Z', null);
    vi.mocked(sessionRepo.findById).mockReturnValue(existingSession);

    useCase.execute({
      sessionId: 'sess-1',
      eventType: 'SessionEnd',
      timestamp: '2025-01-01T02:00:00Z',
    });

    expect(existingSession.status).toBe('completed');
    expect(existingSession.endTime).toBe('2025-01-01T02:00:00Z');
  });
});
