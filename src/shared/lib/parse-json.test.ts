import { extractJson, parseAnalysisJson } from './parse-json';

describe('extractJson', () => {
  it('parses a valid JSON string directly', () => {
    expect(extractJson('{"key": "value"}')).toEqual({ key: 'value' });
  });

  it('parses JSON with surrounding whitespace', () => {
    expect(extractJson('  {"a": 1}  ')).toEqual({ a: 1 });
  });

  it('extracts JSON from a markdown code fence', () => {
    const input = 'Here is the result:\n```json\n{"status": "ok"}\n```\nDone.';
    expect(extractJson(input)).toEqual({ status: 'ok' });
  });

  it('extracts JSON from a code fence without json tag', () => {
    const input = 'Result:\n```\n{"x": 42}\n```';
    expect(extractJson(input)).toEqual({ x: 42 });
  });

  it('extracts JSON by finding first { and last }', () => {
    const input = 'Some text before {"nested": true} and after';
    expect(extractJson(input)).toEqual({ nested: true });
  });

  it('returns null for invalid input with no JSON', () => {
    expect(extractJson('no json here')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractJson('')).toBeNull();
  });

  it('returns null for malformed JSON in braces', () => {
    expect(extractJson('prefix {not: valid json} suffix')).toBeNull();
  });
});

describe('parseAnalysisJson', () => {
  it('returns null for null input', () => {
    expect(parseAnalysisJson(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseAnalysisJson('')).toBeNull();
  });

  it('parses a valid JSON string', () => {
    expect(parseAnalysisJson('{"plans": []}')).toEqual({ plans: [] });
  });

  it('unwraps rawOutput envelope', () => {
    const inner = JSON.stringify({ result: 'data' });
    const envelope = JSON.stringify({ rawOutput: inner });
    expect(parseAnalysisJson(envelope)).toEqual({ result: 'data' });
  });

  it('falls back to parsed value when rawOutput extraction fails', () => {
    const envelope = JSON.stringify({ rawOutput: 'not valid json at all' });
    expect(parseAnalysisJson(envelope)).toEqual({ rawOutput: 'not valid json at all' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseAnalysisJson('not json')).toBeNull();
  });
});
