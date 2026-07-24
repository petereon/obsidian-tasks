import {
  formatRepeatAnnotation,
  parseRepeatRule,
  REPEAT_REGEX,
  REPEAT_REGEX_GLOBAL,
} from "../src/repeatRule";

describe("REPEAT_REGEX", () => {
  it("matches a bare unit annotation", () => {
    expect(REPEAT_REGEX.test("[repeat:: every week]")).toBe(true);
  });

  it("matches a counted, pluralized annotation", () => {
    expect(REPEAT_REGEX.test("[repeat:: every 3 days]")).toBe(true);
  });

  it("does not match malformed annotations", () => {
    expect(REPEAT_REGEX.test("[repeat:: sometimes]")).toBe(false);
  });
});

describe("REPEAT_REGEX_GLOBAL", () => {
  it("strips the annotation including leading whitespace", () => {
    const result = "Weekly review   [repeat:: every week]".replace(REPEAT_REGEX_GLOBAL, "");
    expect(result).toBe("Weekly review");
  });

  it("strips a counted annotation including leading whitespace", () => {
    const result = "Standup [repeat:: every 3 days]".replace(REPEAT_REGEX_GLOBAL, "");
    expect(result).toBe("Standup");
  });
});

describe("parseRepeatRule", () => {
  it("returns null when no annotation present", () => {
    expect(parseRepeatRule("Buy groceries")).toBeNull();
  });

  it("parses a bare unit as count 1", () => {
    expect(parseRepeatRule("Weekly review [repeat:: every week]")).toEqual({
      count: 1,
      unit: "week",
    });
  });

  it("parses a counted, pluralized unit", () => {
    expect(parseRepeatRule("Standup [repeat:: every 3 days]")).toEqual({
      count: 3,
      unit: "day",
    });
  });

  it("tolerates a counted unit without the plural s", () => {
    expect(parseRepeatRule("[repeat:: every 2 week]")).toEqual({ count: 2, unit: "week" });
  });
});

describe("formatRepeatAnnotation", () => {
  it("formats count 1 without the number, singular unit", () => {
    expect(formatRepeatAnnotation({ count: 1, unit: "day" })).toBe("[repeat:: every day]");
    expect(formatRepeatAnnotation({ count: 1, unit: "week" })).toBe("[repeat:: every week]");
    expect(formatRepeatAnnotation({ count: 1, unit: "month" })).toBe("[repeat:: every month]");
    expect(formatRepeatAnnotation({ count: 1, unit: "year" })).toBe("[repeat:: every year]");
  });

  it("formats counts above 1 with the number, pluralized unit", () => {
    expect(formatRepeatAnnotation({ count: 3, unit: "day" })).toBe("[repeat:: every 3 days]");
    expect(formatRepeatAnnotation({ count: 2, unit: "week" })).toBe("[repeat:: every 2 weeks]");
  });

  it("round-trips through parseRepeatRule", () => {
    const rule = { count: 3, unit: "month" as const };
    expect(parseRepeatRule(formatRepeatAnnotation(rule))).toEqual(rule);
  });
});
