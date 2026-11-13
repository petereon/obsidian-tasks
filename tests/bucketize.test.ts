import { bucketize } from "../src/components/GroupedView";
import type { Task } from "../src/types";

const t = (id: string, o: Partial<Task> = {}): Task => ({
  id, text: id, due: null, hasTime: false, completed: false, filePath: "a.md",
  fileName: "a", line: 0, repeat: null, parentId: null, priority: null, tags: [], ...o,
});
const now = new Date(2026, 5, 10, 12);

describe("bucketize ordering", () => {
  it("breaks same-day ties by priority, high first", () => {
    const due = new Date(2026, 5, 10);
    const { today } = bucketize(
      [t("low", { due, priority: "low" }), t("none", { due }), t("high", { due, priority: "high" })],
      now
    );
    expect(today.map((x) => x.id)).toEqual(["high", "low", "none"]);
  });
  it("due time still beats priority", () => {
    const { upcoming } = bucketize(
      [t("later", { due: new Date(2026, 5, 12), priority: "high" }), t("sooner", { due: new Date(2026, 5, 11) })],
      now
    );
    expect(upcoming.map((x) => x.id)).toEqual(["sooner", "later"]);
  });
  it("orders no-date tasks by priority", () => {
    const { noDate } = bucketize([t("a"), t("b", { priority: "medium" })], now);
    expect(noDate.map((x) => x.id)).toEqual(["b", "a"]);
  });
});
