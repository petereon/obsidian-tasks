import { TFile, type Vault } from "obsidian";

export async function addQuickTask(vault: Vault, inboxPath: string, text: string): Promise<void> {
  const existing = vault.getAbstractFileByPath(inboxPath);
  const file = existing instanceof TFile ? existing : await vault.create(inboxPath, "");

  await vault.process(file, (content) => {
    const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
    return `${content}${separator}- [ ] ${text}\n`;
  });
}
