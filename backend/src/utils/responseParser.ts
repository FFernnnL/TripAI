import { AIDayResult } from '../types';

/**
 * Parse the AI's streamed response to extract day-by-day JSON objects.
 * The AI outputs JSON objects separated by ---DAY_SEPARATOR---
 */
export function parseDayFromChunk(buffer: string): { day: AIDayResult | null; remaining: string } {
  const separatorIndex = buffer.indexOf('---DAY_SEPARATOR---');

  if (separatorIndex === -1) {
    // Try to parse the whole buffer as a complete JSON (for the last day)
    const trimmed = buffer.trim();
    if (trimmed.endsWith('}')) {
      const jsonStr = extractJson(trimmed);
      if (jsonStr) {
        try {
          const day = JSON.parse(jsonStr) as AIDayResult;
          if (day.dayNumber && day.theme) {
            return { day, remaining: '' };
          }
        } catch {
          // not complete yet
        }
      }
    }
    return { day: null, remaining: buffer };
  }

  const jsonPart = buffer.substring(0, separatorIndex).trim();
  const remaining = buffer.substring(separatorIndex + '---DAY_SEPARATOR---'.length);

  const jsonStr = extractJson(jsonPart);
  if (!jsonStr) {
    return { day: null, remaining };
  }

  try {
    const day = JSON.parse(jsonStr) as AIDayResult;
    return { day, remaining };
  } catch {
    return { day: null, remaining };
  }
}

function extractJson(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.substring(start, end + 1);
}
