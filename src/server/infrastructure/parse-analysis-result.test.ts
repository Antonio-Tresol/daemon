import { describe, expect, it } from 'vitest';
import { parseAnalysisResult } from './parse-analysis-result';

describe('parseAnalysisResult', () => {
  it('extracts plans from JSON', () => {
    const json = JSON.stringify({
      plans: [{ name: 'Plan A', phase: 'research', tasks: [] }],
    });

    const result = parseAnalysisResult(json);

    expect(result.plans).toEqual([{ name: 'Plan A', phase: 'research', tasks: [] }]);
    expect(result.failures).toBeUndefined();
    expect(result.improvements).toBeUndefined();
  });

  it('extracts failures from JSON', () => {
    const json = JSON.stringify({
      failures: [
        {
          timestamp: '2026-01-01T00:00:00Z',
          type: 'tool_failure',
          description: 'fail',
          rootCause: 'unknown',
          impact: 'warning',
          eventId: null,
          evidence: [],
        },
      ],
    });

    const result = parseAnalysisResult(json);

    expect(result.failures).toHaveLength(1);
    expect(result.failures?.[0]?.type).toBe('tool_failure');
  });

  it('extracts improvements from JSON', () => {
    const json = JSON.stringify({
      improvements: [
        {
          area: 'hooks',
          problem: 'slow',
          suggestion: 'cache',
          config: null,
          severity: 'high',
          category: 'feedback-loop',
          effort: 'low',
          evidence: [],
        },
      ],
    });

    const result = parseAnalysisResult(json);

    expect(result.improvements).toHaveLength(1);
    expect(result.improvements?.[0]?.area).toBe('hooks');
  });

  it('extracts all fields when present', () => {
    const json = JSON.stringify({
      plans: [{ name: 'P1', phase: 'testing', tasks: [] }],
      failures: [],
      improvements: [],
    });

    const result = parseAnalysisResult(json);

    expect(result.plans).toBeDefined();
    expect(result.failures).toBeDefined();
    expect(result.improvements).toBeDefined();
  });

  it('returns empty object when no recognized fields present', () => {
    const json = JSON.stringify({ unknown: 'field' });

    const result = parseAnalysisResult(json);

    expect(result).toEqual({});
  });

  it('throws on invalid JSON', () => {
    expect(() => parseAnalysisResult('not json')).toThrow();
  });

  it('ignores non-array plans/failures/improvements', () => {
    const json = JSON.stringify({
      plans: 'not an array',
      failures: 42,
      improvements: { not: 'array' },
    });

    const result = parseAnalysisResult(json);

    expect(result).toEqual({});
  });
});
