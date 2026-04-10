import { describe, it, expect } from "vitest";
import { scopeMatchesFiles, globMatch } from "./scope-match.js";

describe("globMatch", () => {
  it("matches exact path", () => {
    expect(globMatch("src/main.ts", "src/main.ts")).toBe(true);
  });

  it("* matches within directory", () => {
    expect(globMatch("src/*.ts", "src/main.ts")).toBe(true);
    expect(globMatch("src/*.ts", "src/lib/deep.ts")).toBe(false);
  });

  it("** matches across directories", () => {
    expect(globMatch("src/**", "src/main.ts")).toBe(true);
    expect(globMatch("src/**", "src/lib/deep/file.ts")).toBe(true);
    expect(globMatch("src/**", "lib/other.ts")).toBe(false);
  });

  it("**/ matches intermediate directories", () => {
    expect(globMatch("src/**/test.ts", "src/test.ts")).toBe(true);
    expect(globMatch("src/**/test.ts", "src/lib/test.ts")).toBe(true);
    expect(globMatch("src/**/test.ts", "src/a/b/c/test.ts")).toBe(true);
  });

  it("? matches single char", () => {
    expect(globMatch("src/?.ts", "src/a.ts")).toBe(true);
    expect(globMatch("src/?.ts", "src/ab.ts")).toBe(false);
  });

  it("handles dots in extensions", () => {
    expect(globMatch("*.json", "package.json")).toBe(true);
    expect(globMatch("*.json", "tsconfig.json")).toBe(true);
    expect(globMatch("*.json", "file.ts")).toBe(false);
  });

  it("trailing ** matches all under dir", () => {
    expect(globMatch("terraform/**", "terraform/main.tf")).toBe(true);
    expect(globMatch("terraform/**", "terraform/modules/vpc/main.tf")).toBe(true);
  });
});

describe("scopeMatchesFiles", () => {
  it("empty scope matches everything", () => {
    expect(scopeMatchesFiles([], ["src/main.ts"])).toBe(true);
  });

  it("matches when at least one file matches one pattern", () => {
    expect(scopeMatchesFiles(["src/api/**"], ["src/api/handler.ts", "README.md"])).toBe(true);
  });

  it("no match when no file matches", () => {
    expect(scopeMatchesFiles(["src/api/**"], ["lib/utils.ts", "README.md"])).toBe(false);
  });

  it("multiple patterns, one matches", () => {
    expect(scopeMatchesFiles(["src/api/**", "src/middleware/**"], ["src/middleware/auth.ts"])).toBe(true);
  });
});
