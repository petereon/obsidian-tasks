import { splitByNote } from "../src/thisNote";
import type { Task } from "../src/types";

const t = (id: string, filePath: string): Task => ({
  id, text: id, due: null, hasTime: false, completed: false, filePath, fileName: filePath,
  line: 0, repeat: null, parentId: null, priority: null, tags: [], project: null, heading: null,
});
const tasks = [t("own", "trip.md"), t("linker", "daily.md"), t("other", "misc.md")];
const links = { "daily.md": { "trip.md": 2 }, "misc.md": { "other.md": 1 }, "trip.md": { "daily.md": 1 } };

describe("splitByNote", () => {
  it("separates tasks in the note from tasks in notes linking to it", () => {
    const r = splitByNote(tasks, "trip.md", links);
    expect(r.inNote.map((x) => x.id)).toEqual(["own"]);
    expect(r.backlinks.map((x) => x.id)).toEqual(["linker"]);
  });
  it("link direction matters: only notes linking TO the active one count", () => {
    expect(splitByNote(tasks, "daily.md", links).backlinks.map((x) => x.id)).toEqual(["own"]);
  });
  it("returns nothing with no active note", () => {
    expect(splitByNote(tasks, null, links)).toEqual({ inNote: [], backlinks: [] });
  });
});
