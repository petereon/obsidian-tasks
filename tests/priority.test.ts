import { formatPriorityAnnotation, parsePriority } from "../src/priority";

describe("parsePriority", () => {
  it("returns null when no annotation present", () => {
    expect(parsePriority("Buy groceries")).toBeNull();
  });

  it("parses [priority:: high]", () => {
    expect(parsePriority("Ship release [priority:: high]")).toBe("high");
  });

  it("parses [priority:: medium]", () => {
    expect(parsePriority("Review PR [priority:: medium]")).toBe("medium");
  });

  it("parses [priority:: low]", () => {
    expect(parsePriority("Clean desk [priority:: low]")).toBe("low");
  });

  it("returns null for a malformed value", () => {
    expect(parsePriority("Something [priority:: urgent]")).toBeNull();
  });
});

describe("formatPriorityAnnotation", () => {
  it("formats each level", () => {
    expect(formatPriorityAnnotation("high")).toBe("[priority:: high]");
    expect(formatPriorityAnnotation("medium")).toBe("[priority:: medium]");
    expect(formatPriorityAnnotation("low")).toBe("[priority:: low]");
  });
});
