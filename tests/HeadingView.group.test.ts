import { groupByHeading } from "../src/components/HeadingView";
import type { Task } from "../src/types";

const t = (id: string, line: number, o: Partial<Task> = {}): Task => ({
  id, text: id, due: null, hasTime: false, completed: false, filePath: "a.md", fileName: "a",
  line, repeat: null, parentId: null, priority: null, tags: [], project: null, heading: null, ...o,
});

describe("groupByHeading", () => {
  it("groups by note › heading, document order inside, headingless as plain note name", () => {
    const g = groupByHeading([t("x", 5, { heading: "Plan" }), t("y", 1, { heading: "Plan" }), t("z", 0)]);
    expect(g.map((x) => x.label)).toEqual(["a", "a › Plan"]);
    expect(g[1].tasks.map((x) => x.id)).toEqual(["y", "x"]);
  });
});
