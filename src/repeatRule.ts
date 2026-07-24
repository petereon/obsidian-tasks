import type { RepeatRule } from "./types";

export const REPEAT_REGEX = /\[repeat::\s*every\s+(?:(\d+)\s+)?(day|week|month|year)s?\s*\]/;
export const REPEAT_REGEX_GLOBAL = /\s*\[repeat::\s*every\s+(?:\d+\s+)?(?:day|week|month|year)s?\s*\]/g;

export function parseRepeatRule(text: string): RepeatRule | null {
  const match = text.match(REPEAT_REGEX);
  if (!match) return null;

  const [, countStr, unit] = match;
  const count = countStr ? Number(countStr) : 1;

  return { count, unit: unit as RepeatRule["unit"] };
}

export function formatRepeatAnnotation(rule: RepeatRule): string {
  const { count, unit } = rule;
  if (count === 1) return `[repeat:: every ${unit}]`;
  return `[repeat:: every ${count} ${unit}s]`;
}
