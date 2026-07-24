import type { ListItemCache } from "obsidian";
import type { RepeatRule, Task } from "./types";
import { DUE_REGEX, parseDue } from "./dueDate";

const DONE_REGEX = /\[done::\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\]/;
const NO_COLLECT_REGEX = /\[tasks-no-collect::\s*(true|false)\s*\]/;
const REPEAT_REGEX = /\[repeat::\s*every\s+(?:(\d+)\s+)?(day|week|month|year)s?\s*\]/;
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\([^)]+\)/g;

function wikilinkCaption(_match: string, inner: string): string {
  const [target, alias] = inner.split("|");
  return (alias ?? target.split("#")[0]).trim();
}

export function shouldExcludeFile(frontmatter: Record<string, unknown> | undefined): boolean {
  return frontmatter?.["tasks-no-collect"] === true;
}

export function parseTasksFromFile(
  filePath: string,
  content: string,
  listItems: ListItemCache[]
): Task[] {
  const lines = content.split("\n");
  const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") ?? filePath;
  const tasks: Task[] = [];

  for (const item of listItems) {
    if (item.task === undefined) continue;

    const lineNumber = item.position.start.line;
    const lineText = lines[lineNumber];
    if (!lineText) continue;

    const textMatch = lineText.match(/^\s*- \[.\]\s*(.*)/);
    if (!textMatch) continue;

    const rawText = textMatch[1];
    const noCollectMatch = rawText.match(NO_COLLECT_REGEX);
    if (noCollectMatch?.[1] === "true") continue;

    const { due, hasTime } = parseDue(rawText);
    const completedAt = parseDone(rawText);
    const repeat = parseRepeatRule(rawText);
    const text = rawText
      .replace(DUE_REGEX, "")
      .replace(DONE_REGEX, "")
      .replace(NO_COLLECT_REGEX, "")
      .replace(REPEAT_REGEX, "")
      .replace(WIKILINK_REGEX, wikilinkCaption)
      .replace(MARKDOWN_LINK_REGEX, "$1")
      .replace(/\s+/g, " ")
      .trim();

    tasks.push({
      id: `${filePath}::${lineNumber}`,
      text,
      due,
      hasTime,
      completed: item.task !== " ",
      completedAt,
      filePath,
      fileName,
      line: lineNumber,
      repeat,
    });
  }

  return tasks;
}

function parseDone(text: string): Date | undefined {
  const match = text.match(DONE_REGEX);
  if (!match) return undefined;
  const [, dateStr, timeStr] = match;
  const [year, month, day] = (dateStr as string).split("-").map(Number);
  const [hours, minutes] = (timeStr as string).split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}

export function parseRepeatRule(text: string): RepeatRule | null {
  const match = text.match(REPEAT_REGEX);
  if (!match) return null;

  const [, countStr, unit] = match;
  const count = countStr ? Number(countStr) : 1;

  return { count, unit: unit as RepeatRule["unit"] };
}
