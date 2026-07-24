import { DUE_REGEX, formatDueAnnotation, parseDue } from "../src/dueDate";

describe("DUE_REGEX", () => {
  it("matches a date-only annotation", () => {
    expect(DUE_REGEX.test("[due:: 2025-06-01]")).toBe(true);
  });

  it("matches a date-with-time annotation", () => {
    expect(DUE_REGEX.test("[due:: 2025-06-01 14:30]")).toBe(true);
  });

  it("does not match malformed annotations", () => {
    expect(DUE_REGEX.test("[due:: not-a-date]")).toBe(false);
  });
});

describe("parseDue", () => {
  it("returns null due and hasTime false when no annotation present", () => {
    expect(parseDue("Buy groceries")).toEqual({ due: null, hasTime: false });
  });

  it("parses a date-only annotation", () => {
    const { due, hasTime } = parseDue("Call dentist [due:: 2025-06-01]");
    expect(due).toEqual(new Date(2025, 5, 1, 0, 0, 0));
    expect(hasTime).toBe(false);
  });

  it("parses a date-with-time annotation", () => {
    const { due, hasTime } = parseDue("Meeting [due:: 2025-06-01 14:30]");
    expect(due).toEqual(new Date(2025, 5, 1, 14, 30, 0));
    expect(hasTime).toBe(true);
  });
});

describe("formatDueAnnotation", () => {
  it("formats a date-only annotation", () => {
    expect(formatDueAnnotation(new Date(2025, 5, 1, 0, 0, 0), false)).toBe("[due:: 2025-06-01]");
  });

  it("formats a date-with-time annotation", () => {
    expect(formatDueAnnotation(new Date(2025, 5, 1, 14, 30, 0), true)).toBe(
      "[due:: 2025-06-01 14:30]"
    );
  });

  it("pads single-digit month, day, hour, and minute", () => {
    expect(formatDueAnnotation(new Date(2025, 0, 5, 9, 5, 0), true)).toBe(
      "[due:: 2025-01-05 09:05]"
    );
  });
});
