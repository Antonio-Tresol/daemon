import { describe, it, expect, vi } from 'vitest';
import {
  ANALYSIS_TYPES,
  isValidAnalysisType,
  createAnalysis,
  markRunning,
  completeAnalysis,
  failAnalysis,
  type AnalysisResult,
} from './analysis.entity';

describe('ANALYSIS_TYPES', () => {
  it('contains timeline, failures, and improvements', () => {
    expect(ANALYSIS_TYPES).toEqual(['timeline', 'failures', 'improvements']);
  });
});

describe('isValidAnalysisType', () => {
  it('returns true for valid analysis types', () => {
    expect(isValidAnalysisType('timeline')).toBe(true);
    expect(isValidAnalysisType('failures')).toBe(true);
    expect(isValidAnalysisType('improvements')).toBe(true);
  });

  it('returns false for invalid analysis types', () => {
    expect(isValidAnalysisType('invalid')).toBe(false);
    expect(isValidAnalysisType('')).toBe(false);
    expect(isValidAnalysisType('Timeline')).toBe(false); // case-sensitive
  });
});

describe('createAnalysis', () => {
  it('creates a pending analysis with defaults', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const analysis = createAnalysis('a-1', 'sess-1', 'timeline');

    expect(analysis.id).toBe('a-1');
    expect(analysis.sessionId).toBe('sess-1');
    expect(analysis.analysisType).toBe('timeline');
    expect(analysis.level).toBe(0);
    expect(analysis.triggeredAt).toBe('2025-06-01T00:00:00.000Z');
    expect(analysis.completedAt).toBeNull();
    expect(analysis.status).toBe('pending');
    expect(analysis.result).toBeNull();
    expect(analysis.error).toBeNull();

    vi.useRealTimers();
  });

  it('accepts a custom level', () => {
    const analysis = createAnalysis('a-2', 'sess-1', 'failures', 3);
    expect(analysis.level).toBe(3);
  });
});

describe('markRunning', () => {
  it('transitions status to running without mutating original', () => {
    const original = createAnalysis('a-1', 'sess-1', 'timeline');
    const running = markRunning(original);

    expect(running.status).toBe('running');
    expect(original.status).toBe('pending'); // immutable
    expect(running.id).toBe(original.id);
  });
});

describe('completeAnalysis', () => {
  it('transitions to completed with result', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T01:00:00Z'));

    const running = markRunning(createAnalysis('a-1', 'sess-1', 'failures'));
    const result = { failures: [] };
    const completed = completeAnalysis(running, result);

    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBe('2025-06-01T01:00:00.000Z');
    expect(completed.result).toEqual(result);
    expect(completed.error).toBeNull();

    // Original not mutated
    expect(running.status).toBe('running');

    vi.useRealTimers();
  });
});

describe('failAnalysis', () => {
  it('transitions to failed with error message', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T02:00:00Z'));

    const running = markRunning(createAnalysis('a-1', 'sess-1', 'improvements'));
    const failed = failAnalysis(running, 'Something went wrong');

    expect(failed.status).toBe('failed');
    expect(failed.completedAt).toBe('2025-06-01T02:00:00.000Z');
    expect(failed.error).toBe('Something went wrong');
    expect(failed.result).toBeNull();

    // Original not mutated
    expect(running.status).toBe('running');

    vi.useRealTimers();
  });
});
