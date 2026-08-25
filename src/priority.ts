export type Priority = "high" | "medium" | "low";

export const PRIORITY_REGEX = /\[priority::\s*(high|medium|low)\s*\]/;
export const PRIORITY_REGEX_GLOBAL = /\s*\[priority::\s*(high|medium|low)\s*\]/g;

export function parsePriority(text: string): Priority | null {
  const match = text.match(PRIORITY_REGEX);
  if (!match) return null;
  return match[1] as Priority;
}

export function formatPriorityAnnotation(priority: Priority): string {
  return `[priority:: ${priority}]`;
}
