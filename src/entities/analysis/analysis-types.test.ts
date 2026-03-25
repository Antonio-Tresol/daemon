import { ANALYSIS_TYPES, isValidAnalysisType } from './analysis-types';

describe('ANALYSIS_TYPES', () => {
  it('has exactly 3 elements', () => {
    expect(ANALYSIS_TYPES).toHaveLength(3);
  });

  it('contains timeline, failures, and improvements', () => {
    expect(ANALYSIS_TYPES).toContain('timeline');
    expect(ANALYSIS_TYPES).toContain('failures');
    expect(ANALYSIS_TYPES).toContain('improvements');
  });
});

describe('isValidAnalysisType', () => {
  it('returns true for timeline', () => {
    expect(isValidAnalysisType('timeline')).toBe(true);
  });

  it('returns true for failures', () => {
    expect(isValidAnalysisType('failures')).toBe(true);
  });

  it('returns true for improvements', () => {
    expect(isValidAnalysisType('improvements')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidAnalysisType('')).toBe(false);
  });

  it('returns false for invalid string', () => {
    expect(isValidAnalysisType('invalid')).toBe(false);
  });

  it('is case sensitive', () => {
    expect(isValidAnalysisType('Timeline')).toBe(false);
    expect(isValidAnalysisType('FAILURES')).toBe(false);
  });
});
