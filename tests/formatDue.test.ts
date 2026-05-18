import { formatDue } from "../src/formatDue";

const TODAY = new Date(2025, 5, 15, 12, 0, 0);

describe("formatDue", () => {
  it("returns empty string for null", () => {
    expect(formatDue(null, false, TODAY)).toBe("");
  });

  it("formats today without time", () => {
    const due = new Date(2025, 5, 15, 0, 0, 0);
    expect(formatDue(due, false, TODAY)).toBe("today");
  });

  it("formats today with time", () => {
    const due = new Date(2025, 5, 15, 14, 30, 0);
    expect(formatDue(due, true, TODAY)).toBe("today 14:30");
  });

  it("formats yesterday", () => {
    const due = new Date(2025, 5, 14, 0, 0, 0);
    expect(formatDue(due, false, TODAY)).toBe("yesterday");
  });

  it("formats yesterday with time", () => {
    const due = new Date(2025, 5, 14, 9, 0, 0);
    expect(formatDue(due, true, TODAY)).toBe("yesterday 09:00");
  });

  it("formats multiple days ago", () => {
    const due = new Date(2025, 5, 10, 0, 0, 0);
    expect(formatDue(due, false, TODAY)).toBe("5 days ago");
  });

  it("formats tomorrow", () => {
    const due = new Date(2025, 5, 16, 0, 0, 0);
    expect(formatDue(due, false, TODAY)).toBe("tomorrow");
  });

  it("formats tomorrow with time", () => {
    const due = new Date(2025, 5, 16, 10, 0, 0);
    expect(formatDue(due, true, TODAY)).toBe("tomorrow 10:00");
  });

  it("formats future date", () => {
    const due = new Date(2025, 5, 25, 0, 0, 0);
    expect(formatDue(due, false, TODAY)).toBe("Jun 25");
  });

  it("formats future date with time", () => {
    const due = new Date(2025, 5, 25, 8, 5, 0);
    expect(formatDue(due, true, TODAY)).toBe("Jun 25 08:05");
  });
});
