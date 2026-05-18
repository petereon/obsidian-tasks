# Tasks Panel

An [Obsidian](https://obsidian.md) plugin that aggregates every task across your vault into a live sidebar panel with due dates, notifications, and completion tracking.

![Tasks Panel preview](assets/preview.png)

## Features

- **Vault-wide task list** — scans all markdown files; updates in real time as you edit
- **Grouped & Flat views** — group tasks by source note or see everything in one list
- **Due dates** — add `[due:: 2025-06-01]` or `[due:: 2025-06-01 14:30]` to any task
- **Desktop notifications** — fires a notification N minutes before a timed task is due (configurable)
- **Completion timestamps** — checking a task writes `[done:: YYYY-MM-DD HH:MM]` back to the file; unchecking strips it
- **Jump to source** — click a task or its filename to open the note at the exact line

## Installation

### From a release (recommended)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create `<vault>/.obsidian/plugins/obsidian-tasks-panel/` and place the three files inside
3. In Obsidian: **Settings → Community plugins → enable Tasks Panel**

### For development

1. Clone this repo directly into your vault's plugins folder (or symlink it there)
2. Run `bun install && bun run build`
3. In Obsidian: **Settings → Community plugins → enable Tasks Panel**

## Usage

Open the panel via the ribbon icon (☑) or **Ctrl/Cmd+P → "Open Tasks panel"**.

### Due dates

| Syntax | Meaning |
|---|---|
| `[due:: 2025-06-01]` | Date-only due date |
| `[due:: 2025-06-01 09:00]` | Date + time (enables notifications) |

Set or update a due date on the current task line with **Ctrl/Cmd+P → "Set due date"** — opens a date/time picker and writes the annotation for you.

### Notifications

Only tasks with a specific time trigger notifications. Configure the lead time in **Settings → Tasks Panel → Notification threshold** (default: 15 minutes). Click a notification to jump to the task.

## Development

```sh
bun install
bun run dev      # watch + rebuild
bun run build    # production build
bun run test     # jest test suite
```

Requires Obsidian ≥ 1.4.0.

## License

MIT
