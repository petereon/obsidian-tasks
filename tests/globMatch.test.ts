import { matchesAnyPattern } from "../src/globMatch";

describe("matchesAnyPattern", () => {
  it("matches an exact literal file path", () => {
    expect(matchesAnyPattern("Inbox/scratch.md", ["Inbox/scratch.md"])).toBe(true);
  });

  it("does not match a different literal file path", () => {
    expect(matchesAnyPattern("Inbox/other.md", ["Inbox/scratch.md"])).toBe(false);
  });

  it("** matches every file nested under a folder", () => {
    expect(matchesAnyPattern("Templates/Daily/2026-01-01.md", ["Templates/**"])).toBe(true);
  });

  it("** matches zero segments in the middle of a pattern", () => {
    expect(matchesAnyPattern("Archive/2020.md", ["Archive/**/*.md"])).toBe(true);
  });

  it("** does not match a file outside the folder", () => {
    expect(matchesAnyPattern("Inbox/note.md", ["Templates/**"])).toBe(false);
  });

  it("* matches within a single path segment", () => {
    expect(matchesAnyPattern("Templates/Daily.md", ["Templates/*.md"])).toBe(true);
  });

  it("* does not cross a path separator", () => {
    expect(matchesAnyPattern("Templates/Sub/Note.md", ["Templates/*"])).toBe(false);
  });

  it("a bare folder name does not match files inside it (no gitignore-style shorthand)", () => {
    expect(matchesAnyPattern("Templates/Daily.md", ["Templates"])).toBe(false);
  });

  it("returns true when any pattern in the list matches", () => {
    expect(matchesAnyPattern("Archive/2020.md", ["Templates/**", "Archive/**"])).toBe(true);
  });

  it("returns false when no pattern matches", () => {
    expect(matchesAnyPattern("Notes/today.md", ["Templates/**", "Archive/**"])).toBe(false);
  });

  it("returns false for an empty pattern list", () => {
    expect(matchesAnyPattern("Notes/today.md", [])).toBe(false);
  });
});
