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
 * Parse an analysis result that may be wrapped in a `{ rawOutput: string }` envelope.
 * Common in results from the Claude CLI agent pipeline.
 */
export function parseAnalysisJson<T = unknown>(resultString: string | null): T | null {
  if (!resultString) return null;
  try {
    let parsed: unknown = JSON.parse(resultString);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'rawOutput' in (parsed as Record<string, unknown>) // narrowing unknown for 'in' operator check
    ) {
      const raw = (parsed as { rawOutput: string }).rawOutput; // narrowing after 'in' check confirms rawOutput exists
      const extracted = extractJson<T>(raw);
      if (extracted !== null) return extracted;
      // If extraction failed, keep the original parsed value
    }
    return parsed as T; // JSON.parse returns unknown, caller provides expected type
  } catch {
    return null;
  }
}
