import type { Task } from "./types";

// Mirrors Obsidian's metadataCache.resolvedLinks: source path -> (target path -> link count)
export type ResolvedLinks = Record<string, Record<string, number>>;

export function splitByNote(
  tasks: Task[],
  activePath: string | null,
  resolvedLinks: ResolvedLinks
): { inNote: Task[]; backlinks: Task[] } {
  if (!activePath) return { inNote: [], backlinks: [] };
  return {
    inNote: tasks.filter((t) => t.filePath === activePath),
    backlinks: tasks.filter(
      (t) => t.filePath !== activePath && (resolvedLinks[t.filePath]?.[activePath] ?? 0) > 0
    ),
  };
}
