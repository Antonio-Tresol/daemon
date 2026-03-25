/**
 * Extract a JSON object from text that may contain explanation before/after the JSON.
 *
 * Strategies tried in order:
 * 1. Entire string is valid JSON
 * 2. JSON wrapped in a markdown code fence
 * 3. First `{` to last `}` substring
 */
export function extractJson<T = unknown>(raw: string): T | null {
  // Strategy 1: Entire string is JSON
  try {
    return JSON.parse(raw.trim()) as T; // JSON.parse returns unknown
  } catch {
    /* continue */
  }

  // Strategy 2: Code fence wrapping
  const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]) as T; // JSON.parse returns unknown
    } catch {
      /* continue */
    }
  }

  // Strategy 3: Find the first { and last } — extract the JSON object
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as T; // JSON.parse returns unknown
    } catch {
      /* continue */
    }
  }

  return null;
}

/**
 * Unwrap a `{ rawOutput: string }` envelope if present, returning the inner parsed JSON.
 * Works on an already-parsed value (not a raw string). Returns the original value if not wrapped.
 */
export function unwrapRawOutput(value: unknown): unknown {
  if (
    value !== null &&
    typeof value === 'object' &&
    'rawOutput' in (value as Record<string, unknown>) // narrowing unknown for 'in' operator check
  ) {
    const raw = (value as { rawOutput: string }).rawOutput; // narrowing after 'in' check confirms rawOutput exists
    if (typeof raw === 'string') {
      const extracted = extractJson(raw);
      if (extracted !== null) return extracted;
    }
  }
  return value;
}

/**
 * Parse an analysis result that may be wrapped in a `{ rawOutput: string }` envelope.
 * Common in results from the Claude CLI agent pipeline.
 */
export function parseAnalysisJson<T = unknown>(resultString: string | null): T | null {
  if (!resultString) return null;
  try {
    const parsed = JSON.parse(resultString);
    return unwrapRawOutput(parsed) as T; // JSON.parse returns unknown, caller provides expected type
  } catch {
    return null;
  }
}
