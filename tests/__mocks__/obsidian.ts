export class TAbstractFile {
  path: string = "";
  name: string = "";
}

export class TFile extends TAbstractFile {
  extension: string = "md";
  basename: string = "";
  parent: TFolder | null = null;
  stat = { mtime: 0, ctime: 0, size: 0 };
  vault: Vault = {} as Vault;

  constructor(path: string) {
    super();
    this.path = path;
    this.name = path.split("/").pop() ?? path;
    this.basename = this.name.replace(/\.md$/, "");
    this.extension = "md";
  }
}

export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];
  isRoot(): boolean { return false; }
}

export class Plugin {}
export class ItemView {}
export class WorkspaceLeaf {}

export class Modal {
  app: App;
  titleEl = { setText: (_text: string) => {} };
  modalEl = { addClass: (_cls: string) => {} };
  contentEl: HTMLElement = {} as HTMLElement;

  constructor(app: App) {
    this.app = app;
  }

  open(): void {}
  close(): void {}
  onOpen(): void {}
  onClose(): void {}
}

export interface Vault {
  getMarkdownFiles(): TFile[];
  cachedRead(file: TFile): Promise<string>;
  read(file: TFile): Promise<string>;
  process(file: TFile, fn: (content: string) => string): Promise<string>;
  getAbstractFileByPath(path: string): TAbstractFile | null;
  create(path: string, data: string): Promise<TFile>;
  on(event: string, cb: (...args: unknown[]) => unknown): EventRef;
}

export interface MetadataCache {
  getFileCache(file: TFile): CachedMetadata | null;
  on(event: string, cb: (...args: unknown[]) => unknown): EventRef;
}

export interface CachedMetadata {
  listItems?: ListItemCache[];
}

export interface ListItemCache {
  task?: string;
  position: {
    start: { line: number; col: number; offset: number };
    end: { line: number; col: number; offset: number };
  };
  parent: number;
  id?: string;
}

export interface EventRef {}

export interface App {
  vault: Vault;
  metadataCache: MetadataCache;
  workspace: Workspace;
}

export interface Workspace {
  getLeavesOfType(type: string): WorkspaceLeaf[];
  getRightLeaf(split: boolean): WorkspaceLeaf | null;
  getLeaf(newLeaf?: boolean): WorkspaceLeaf;
  revealLeaf(leaf: WorkspaceLeaf): void;
  onLayoutReady(cb: () => void): void;
  openLinkText(linktext: string, sourcePath: string, newLeaf?: boolean): Promise<void>;
}
