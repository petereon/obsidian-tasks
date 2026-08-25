export interface RepeatRule {
  count: number;
  unit: "day" | "week" | "month" | "year";
}

export interface Task {
  /** Stable identity: `${filePath}::${line}` */
  id: string;
  /** Task text with [due:: ...] syntax stripped */
  text: string;
  due: Date | null;
  /** true when [due:: 2025-01-15 14:30] — false when date-only */
  hasTime: boolean;
  completed: boolean;
  /** Set when [done:: YYYY-MM-DD HH:MM] annotation is present in task text */
  completedAt?: Date;
  /** vault-relative path e.g. "folder/note.md" */
  filePath: string;
  /** display name without extension e.g. "note" */
  fileName: string;
  /** 0-indexed line number in the file */
  line: number;
  /** Set when [repeat:: every ...] annotation is present in task text */
  repeat: RepeatRule | null;
  /** id of the nearest task ancestor in the list tree, or null if top-level */
  parentId: string | null;
}
