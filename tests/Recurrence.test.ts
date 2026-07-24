import { nextOccurrence } from "../src/Recurrence";
import type { RepeatRule } from "../src/types";

describe("nextOccurrence", () => {
  it("advances by one day for a daily rule", () => {
    const due = new Date(2026, 0, 15, 9, 0, 0);
    const now = new Date(2026, 0, 15, 9, 30, 0);
    const rule: RepeatRule = { count: 1, unit: "day" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2026, 0, 16, 9, 0, 0));
  });

  it("advances by one week for a weekly rule", () => {
    const due = new Date(2026, 0, 5, 0, 0, 0); // Monday
    const now = new Date(2026, 0, 5, 12, 0, 0);
    const rule: RepeatRule = { count: 1, unit: "week" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2026, 0, 12, 0, 0, 0));
  });

  it("advances by one month for a monthly rule", () => {
    const due = new Date(2026, 0, 15, 0, 0, 0);
    const now = new Date(2026, 0, 20, 0, 0, 0);
    const rule: RepeatRule = { count: 1, unit: "month" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2026, 1, 15, 0, 0, 0));
  });

  it("advances by one year for a yearly rule", () => {
    const due = new Date(2026, 0, 15, 0, 0, 0);
    const now = new Date(2026, 5, 1, 0, 0, 0);
    const rule: RepeatRule = { count: 1, unit: "year" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2027, 0, 15, 0, 0, 0));
  });

  it("supports a multi-count interval (every 2 weeks)", () => {
    const due = new Date(2026, 0, 5, 0, 0, 0);
    const now = new Date(2026, 0, 5, 0, 0, 0);
    const rule: RepeatRule = { count: 2, unit: "week" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2026, 0, 19, 0, 0, 0));
  });

  it("supports a multi-count interval (every 3 days)", () => {
    const due = new Date(2026, 0, 5, 0, 0, 0);
    const now = new Date(2026, 0, 5, 0, 0, 0);
    const rule: RepeatRule = { count: 3, unit: "day" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2026, 0, 8, 0, 0, 0));
  });

  it("skips ahead past multiple missed occurrences when badly overdue", () => {
    // Weekly task due a month ago, completed today: should land on the next
    // Monday after "now", not simply one week after the original due date.
    const due = new Date(2025, 11, 15, 0, 0, 0); // Monday, a month before "now"
    const now = new Date(2026, 0, 15, 0, 0, 0); // Thursday
    const rule: RepeatRule = { count: 1, unit: "week" };
    const result = nextOccurrence(due, rule, now);
    expect(result).toEqual(new Date(2026, 0, 19, 0, 0, 0)); // next Monday after "now"
    expect(result.getTime()).toBeGreaterThan(now.getTime());
  });

  it("still consumes the current cycle when completed early (before due)", () => {
    // Task due next Monday, completed today (before due): should land on the
    // Monday after next Monday, not loop back to the same due date.
    const due = new Date(2026, 0, 19, 0, 0, 0); // next Monday
    const now = new Date(2026, 0, 15, 0, 0, 0); // Thursday, before due
    const rule: RepeatRule = { count: 1, unit: "week" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2026, 0, 26, 0, 0, 0));
  });

  it("clamps Jan 31 + 1 month to Feb 28 in a non-leap year", () => {
    const due = new Date(2026, 0, 31, 0, 0, 0);
    const now = new Date(2026, 0, 31, 0, 0, 0);
    const rule: RepeatRule = { count: 1, unit: "month" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2026, 1, 28, 0, 0, 0));
  });

  it("clamps Jan 31 + 1 month to Feb 29 in a leap year", () => {
    const due = new Date(2028, 0, 31, 0, 0, 0);
    const now = new Date(2028, 0, 31, 0, 0, 0);
    const rule: RepeatRule = { count: 1, unit: "month" };
    expect(nextOccurrence(due, rule, now)).toEqual(new Date(2028, 1, 29, 0, 0, 0));
  });

  it("preserves time-of-day when advancing", () => {
    const due = new Date(2026, 0, 15, 14, 30, 0);
    const now = new Date(2026, 0, 15, 14, 30, 0);
    const rule: RepeatRule = { count: 1, unit: "day" };
    const result = nextOccurrence(due, rule, now);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });
});
