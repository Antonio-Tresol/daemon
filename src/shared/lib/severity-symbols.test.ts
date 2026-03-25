import { impactSymbol, severitySymbol } from './severity-symbols';

describe('impactSymbol', () => {
  it('returns ✗✗ for critical', () => {
    expect(impactSymbol('critical')).toBe('✗✗');
  });

  it('returns ◆ for warning', () => {
    expect(impactSymbol('warning')).toBe('◆');
  });

  it('returns ○ for info', () => {
    expect(impactSymbol('info')).toBe('○');
  });

  it('returns ○ for unknown impact', () => {
    expect(impactSymbol('unknown')).toBe('○');
  });
});

describe('severitySymbol', () => {
  it('returns ✗✗ for high', () => {
    expect(severitySymbol('high')).toBe('✗✗');
  });

  it('returns ◆ for medium', () => {
    expect(severitySymbol('medium')).toBe('◆');
  });

  it('returns ○ for low', () => {
    expect(severitySymbol('low')).toBe('○');
  });

  it('returns ○ for unknown severity', () => {
    expect(severitySymbol('unknown')).toBe('○');
  });
});
