import type { ListItemCache } from "obsidian";
import type { Task } from "./types";
import { DUE_REGEX, parseDue } from "./dueDate";
import { parseRepeatRule, REPEAT_REGEX } from "./repeatRule";

const DONE_REGEX = /\[done::\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\]/;
const NO_COLLECT_REGEX = /\[tasks-no-collect::\s*(true|false)\s*\]/;
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\([^)]+\)/g;

function wikilinkCaption(_match: string, inner: string): string {
  const [target, alias] = inner.split("|");
  return (alias ?? target.split("#")[0]).trim();
}

export function shouldExcludeFile(frontmatter: Record<string, unknown> | undefined): boolean {
  return frontmatter?.["tasks-no-collect"] === true;
}

// Obsidian's ListItemCache.parent is the line number of the parent list item,
// or negative (encoding the enclosing list's start line) for a top-level item.
function resolveParentTaskId(
  item: ListItemCache,
  filePath: string,
  lineToItem: Map<number, ListItemCache>,
  taskLines: Set<number>
): string | null {
  let current = item;
  while (current.parent >= 0) {
    const parentLine = current.parent;
    if (taskLines.has(parentLine)) return `${filePath}::${parentLine}`;
    const parentItem = lineToItem.get(parentLine);
    if (!parentItem) return null;
    current = parentItem;
  }
  return null;
}

export function parseTasksFromFile(
  filePath: string,
  content: string,
  listItems: ListItemCache[]
): Task[] {
  const lines = content.split("\n");
  const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") ?? filePath;
  const tasks: Task[] = [];

  // Built from *all* list items (not just tasks) so a task nested under a
  // plain bullet can still find its nearest task ancestor by walking up.
  const lineToItem = new Map<number, ListItemCache>();
  const taskLines = new Set<number>();
  for (const item of listItems) {
    lineToItem.set(item.position.start.line, item);
    if (item.task !== undefined) taskLines.add(item.position.start.line);
  }

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
      parentId: resolveParentTaskId(item, filePath, lineToItem, taskLines),
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
