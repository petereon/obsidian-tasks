import type { TFile, Vault } from "obsidian";

const DONE_ANNOTATION_REGEX = /\s*\[done::\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\]/g;

function nowAnnotation(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return ` [done:: ${y}-${mo}-${d} ${h}:${mi}]`;
}

export async function toggleTask(
  vault: Vault,
  file: TFile,
  line: number,
  completed: boolean
): Promise<void> {
  await vault.process(file, (content) => {
    const lines = content.split("\n");
    const target = lines[line];
    if (target === undefined) return content;

    // Flip the checkbox character
    let updated = target.replace(
      /^(\s*- \[)[ x](\].*)$/,
      (_, pre: string, post: string) => `${pre}${completed ? "x" : " "}${post}`
    );

    // Strip any existing done annotation (handles re-checks cleanly)
    updated = updated.replace(DONE_ANNOTATION_REGEX, "");

    // Append fresh annotation when completing
    if (completed) {
      updated = updated.replace(/\s+$/, "") + nowAnnotation();
    }

    lines[line] = updated;
    return lines.join("\n");
  });
}
