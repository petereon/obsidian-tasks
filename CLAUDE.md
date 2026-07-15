# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Tasks Panel" — an Obsidian plugin (`obsidian-tasks-panel`) that scans every markdown file in the vault for checkbox tasks and surfaces them in a live sidebar panel, with due dates, desktop notifications, and completion timestamps.

## Commands

```sh
bun install
bun run dev      # esbuild watch + rebuild -> main.js
bun run build    # tsc --noEmit typecheck, then production esbuild bundle
bun run test     # jest (ts-jest) suite
```

Run a single test file: `bun run test tests/TaskParser.test.ts` (or `npx jest tests/TaskStore.test.ts`).
Run one test case: `npx jest -t "name of test"`.

There is no separate lint script — `bun run build`'s `tsc --noEmit` step is the type-check gate; `tsconfig.json` has `strict: true`.

Jest's default `testEnvironment` is `node` (fast, for pure-function tests). Component tests that need to mount React (via `@testing-library/react`) opt into jsdom per-file with a `/** @jest-environment jsdom */` docblock at the top of the test file — don't flip the global default.

To manually verify in Obsidian: clone/symlink this repo into `<vault>/.obsidian/plugins/obsidian-tasks-panel/`, run `bun run build`, then enable "Tasks Panel" under Community plugins.

## Architecture

Plugin entry point is `main.ts` (root, not in `src/`) — the `ObsidianTasksPlugin` class. It owns the scan/parse/store pipeline and wires everything else together. `src/` holds the pieces it composes:

- **`TaskParser.ts`** — pure function `parseTasksFromFile(filePath, content, listItems)`. Reads Obsidian's `ListItemCache` (from `metadataCache`) to find checkbox lines, then regex-parses `[due:: ...]` and `[done:: ...]` annotations out of the raw line text. This is the only place that understands the annotation syntax for *reading*.
- **`TaskStore.ts`** — an in-memory `Map<filePath, Task[]>` with a pub/sub `subscribe()`. Single source of truth the React UI renders from; `main.ts` calls `updateFile`/`removeFile` after every parse.
- **`TaskToggler.ts`** — `toggleTask(vault, file, line, completed)` writes back to the file: flips the `- [ ]`/`- [x]` char and adds/strips the `[done:: YYYY-MM-DD HH:MM]` annotation via `vault.process`. This is the only place that *writes* task lines.
- **`Notifier.ts`** — polled every 60s from `main.ts`. Tracks per-task "already notified" state (keyed by task id + due timestamp, so editing a due date re-arms it) and fires both an OS `Notification` and an in-app `Notice` for timed tasks entering the threshold window.
- **`src/views/TaskPanelView.tsx`** — the `ItemView` that mounts a React root (`createRoot`) into the sidebar leaf.
- **`src/components/`** — React UI: `TaskPanel` (top-level state: view mode, optimistic "completed today" tracking) → `GroupedView` (buckets into Overdue/Today/Upcoming/No Date/Completed Today) or `FlatView` (single due-date-sorted list) → `TaskItem`. `AppContext.ts` threads the Obsidian `App` instance through React via context (`useApp()`) since Obsidian objects aren't otherwise reachable from components.
- **`src/modals/DueDateModal.ts`** + **`src/components/DateTimePicker.tsx`** — the "Set due date" command opens this `Modal`, which also mounts a React root.
- **`src/settings.ts`** / **`SettingsTab.ts`** — single setting: notification threshold in minutes, persisted via `plugin.saveData`.

### Data flow

1. `metadataCache` "changed" event (debounced 500ms per file in `main.ts`) or initial vault scan triggers `parseFile`.
2. `parseFile` re-parses the file, diffs new tasks against the store's previous snapshot to detect completions/un-completions that lack a `[done::]` annotation, and if so calls `toggleTask` to write the annotation (which re-triggers `changed` → re-parse, this time a no-op) — **before** updating the store. This avoids double-writes and keeps the store consistent with file contents.
3. `store.updateFile` notifies subscribers → React re-renders.
4. Checking a box in the panel UI (`TaskPanel.handleToggle`) calls `toggleTask` directly and optimistically tracks the task as "completed today" client-side until the file-driven re-parse confirms it.

### Task identity

`Task.id` is `${filePath}::${line}` (see `types.ts`) — line-number-based, not content-hashed. Renames are handled explicitly (`removeFile(oldPath)` + reparse new path) in `main.ts`'s vault `rename` listener.

### Obsidian API boundary

Production code imports `obsidian` types directly (no adapter layer). Tests substitute `tests/__mocks__/obsidian.ts` via `jest.config.js`'s `moduleNameMapper` — it's a hand-written partial mock (`TFile`, `Vault`, `Workspace`, etc.), not the real package. When adding code that touches new parts of the Obsidian API, the mock will likely need extending to match.

### Build

`esbuild.config.mjs` bundles `main.ts` → `main.js` (CJS, ES2018 target), externalizing `obsidian`, `electron`, CodeMirror/@lezer packages, and Node builtins — these are provided by the Obsidian runtime, not bundled. `main.js` is checked into the repo (it's a release artifact Obsidian loads directly).
